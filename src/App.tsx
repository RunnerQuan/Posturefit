import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { STEP_ORDER, canEnterStep, getStepProgress } from './app/stepMachine';
import { StepIndicator } from './components/StepIndicator';
import { AnalysisLoader } from './components/AnalysisLoader';
import { CameraCapture } from './features/camera';
import { analyzePose, combineAnalyses, CombinedAnalysisView } from './features/analysis';
import { usePoseDetection, validateKeypointsForMode, KEYPOINT_LABELS_33, MODE_MIN_KEYPOINTS } from './features/pose';
import { CoachChat } from './features/chat/CoachChat';
import { HistoryRail } from './features/history/HistoryRail';
import { ProfileForm } from './features/onboarding/ProfileForm';
import { extractTrainingPlanFromMessage } from './features/chat/exerciseBlock';
import { createCoachClient } from './services/coach';
import { createSession, loadAppState, saveAppState, updateSession } from './services/storage/sessionStorage';
import { generateId } from './lib/ids';
import { getCurrentISOString } from './lib/time';
import type {
  AppState,
  CaptureMode,
  CapturedPhoto,
  CheckInFeedback,
  CoachMessage,
  CombinedAnalysisResult,
  PoseView,
  PostureAnalysisResult,
  PostureSession,
  PostureSessionStep,
  UserProfile,
  ViewSelection,
} from './types';

function createEmptyAppState(): AppState {
  return {
    currentSessionId: null,
    sessions: [],
    schemaVersion: 2,
  };
}

function getSingleAnalysis(session: PostureSession | null): PostureAnalysisResult | null {
  return session?.analysis ?? session?.photos.find(photo => photo.analysis)?.analysis ?? null;
}

function getDisplayAnalysis(session: PostureSession | null): PostureAnalysisResult | CombinedAnalysisResult | null {
  return session?.combinedAnalysis ?? getSingleAnalysis(session);
}

function shouldStartAnalysis(session: PostureSession | null): boolean {
  if (!session || session.step !== 'analysis') {
    return false;
  }
  return session.photos.length > 0 && session.photos.some(photo => !photo.analysis);
}

function getNextView(viewSelection: ViewSelection, currentCaptureView: PoseView | null): PoseView {
  if (viewSelection === 'dual') {
    return currentCaptureView === 'front' ? 'side' : 'front';
  }
  return viewSelection;
}

function getUserFeedbackMessage(feedback: CheckInFeedback, feedbackText?: string): CoachMessage {
  return {
    id: generateId(),
    role: 'user',
    content: feedbackText?.trim() || (feedback === 'completed' ? '做完了' : '太累了'),
    createdAt: getCurrentISOString(),
  };
}

function uniqueNames(names: string[]): string[] {
  return Array.from(new Set(names.map(name => name.trim()).filter(Boolean)));
}

function getExerciseNames(session: PostureSession): string[] {
  return session.plan?.exercises.map(exercise => exercise.name) ?? session.currentExerciseNames ?? [];
}

const coachClient = createCoachClient();

const STEP_PATHS: Record<PostureSessionStep, string> = {
  capture: '/capture',
  analysis: '/analysis',
  profile: '/profile',
  chat: '/chat',
};

function getStepFromPath(pathname: string): PostureSessionStep | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  return STEP_ORDER.includes(segment as PostureSessionStep) ? (segment as PostureSessionStep) : null;
}

function getLatestAllowedStep(session: PostureSession | null): PostureSessionStep {
  return [...STEP_ORDER].reverse().find(step => canEnterStep(session, step)) ?? 'capture';
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeStep = getStepFromPath(location.pathname) ?? 'capture';
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      return loadAppState();
    } catch {
      return createEmptyAppState();
    }
  });
  const currentSession = useMemo(
    () => appState.sessions.find(session => session.id === appState.currentSessionId) ?? null,
    [appState.currentSessionId, appState.sessions]
  );
  const currentStep = routeStep;
  const [captureMode, setCaptureMode] = useState<CaptureMode>(currentSession?.captureMode ?? 'fullBody');
  const [viewSelection, setViewSelection] = useState<ViewSelection>(currentSession?.viewSelection ?? 'dual');
  const [currentCaptureView, setCurrentCaptureView] = useState<PoseView | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCoachWorking, setIsCoachWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { detectPoseFromImage, isModelLoading } = usePoseDetection();

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  const persistSession = useCallback((session: PostureSession, preferences?: Partial<UserProfile>) => {
    setAppState(previous => {
      const sessions = previous.sessions.some(item => item.id === session.id)
        ? previous.sessions.map(item => (item.id === session.id ? session : item))
        : [session, ...previous.sessions];

      return {
        ...previous,
        currentSessionId: session.id,
        sessions,
        preferences: preferences ? { ...previous.preferences, ...preferences } : previous.preferences,
      };
    });
  }, []);

  const navigateToStep = useCallback(
    (step: PostureSessionStep, replace = false) => {
      navigate(STEP_PATHS[step], { replace });
    },
    [navigate]
  );

  useEffect(() => {
    const pathStep = getStepFromPath(location.pathname);
    if (!pathStep) {
      navigateToStep('capture', true);
      return;
    }
    if (!canEnterStep(currentSession, pathStep)) {
      navigateToStep(getLatestAllowedStep(currentSession), true);
    }
  }, [currentSession, location.pathname, navigateToStep]);

  useEffect(() => {
    if (currentSession && canEnterStep(currentSession, currentStep) && currentSession.step !== currentStep) {
      persistSession(updateSession(currentSession, { step: currentStep }));
    }
  }, [currentSession, currentStep, persistSession]);

  const moveToStep = useCallback(
    (step: PostureSessionStep) => {
      if (!canEnterStep(currentSession, step)) {
        return;
      }
      if (currentSession) {
        persistSession(updateSession(currentSession, { step }));
      }
      navigateToStep(step);
    },
    [currentSession, navigateToStep, persistSession]
  );

  const upsertCapturedPhoto = useCallback(
    (dataUrl: string, view: PoseView, sourceType: 'camera' | 'upload') => {
      const photo: CapturedPhoto = {
        id: `${Date.now()}-${view}`,
        view,
        imageUrl: dataUrl,
        capturedAt: getCurrentISOString(),
      };
      const baseSession = currentSession ?? createSession(sourceType, captureMode);
      const photos = [...baseSession.photos.filter(item => item.view !== view), photo];
      const nextStep = viewSelection === 'dual' && view === 'front' ? 'capture' : 'analysis';
      const nextSession = updateSession(baseSession, {
        sourceType,
        captureMode,
        viewSelection,
        photos,
        imageDataUrl: dataUrl,
        step: nextStep,
        analysis: undefined,
        combinedAnalysis: undefined,
        plan: undefined,
        currentExerciseNames: [],
        completedExerciseNames: [],
        generatedExerciseNames: [],
        chatMessages: [],
      });

      setError(null);
      setCurrentCaptureView(viewSelection === 'dual' ? view : null);
      persistSession(nextSession);
      navigateToStep(nextStep);
    },
    [captureMode, currentSession, navigateToStep, persistSession, viewSelection]
  );

  const handleCapture = useCallback(
    (dataUrl: string, explicitView?: PoseView) => {
      const view = explicitView ?? getNextView(viewSelection, currentCaptureView);
      upsertCapturedPhoto(dataUrl, view, 'camera');
    },
    [currentCaptureView, upsertCapturedPhoto, viewSelection]
  );

  const handleUpload = useCallback(
    (dataUrl: string, explicitView?: PoseView) => {
      const view = explicitView ?? getNextView(viewSelection, currentCaptureView);
      upsertCapturedPhoto(dataUrl, view, 'upload');
    },
    [currentCaptureView, upsertCapturedPhoto, viewSelection]
  );

  const handleResetCapture = useCallback(() => {
    if (!currentSession || viewSelection !== 'dual' || currentCaptureView !== 'front') {
      return;
    }
    const nextSession = updateSession(currentSession, {
      photos: currentSession.photos.filter(photo => photo.view !== 'front'),
      imageDataUrl: undefined,
      step: 'capture',
    });
    setCurrentCaptureView(null);
    persistSession(nextSession);
  }, [currentCaptureView, currentSession, persistSession, viewSelection]);

  const performAnalysis = useCallback(
    async (session: PostureSession) => {
      const photo = session.photos.find(item => !item.analysis);
      if (!photo) {
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const minKeypointCount = MODE_MIN_KEYPOINTS[session.captureMode];
        const keypoints = await detectPoseFromImage(photo.imageUrl, minKeypointCount);
        const validation = validateKeypointsForMode(keypoints, session.captureMode);

        if (!validation.isValid) {
          const missingLabels = validation.missingKeypoints?.map(keypoint => KEYPOINT_LABELS_33[keypoint]).join('、') || '';
          setError(`${validation.message}${missingLabels ? `\n缺失关键点：${missingLabels}` : ''}`);
          return;
        }

        const result = analyzePose(keypoints, {
          view: photo.view,
          captureMode: session.captureMode,
        });
        const photos = session.photos.map(item => (item.id === photo.id ? { ...item, analysis: result } : item));
        const analyzedPhotos = photos.filter(item => item.analysis);
        const frontAnalysis = photos.find(item => item.view === 'front')?.analysis ?? null;
        const sideAnalysis = photos.find(item => item.view === 'side')?.analysis ?? null;
        const hasAllRequiredAnalysis =
          session.viewSelection === 'dual'
            ? Boolean(frontAnalysis || sideAnalysis) && analyzedPhotos.length >= Math.min(2, photos.length)
            : analyzedPhotos.length >= 1;
        const combinedAnalysis = hasAllRequiredAnalysis ? combineAnalyses(frontAnalysis, sideAnalysis) : session.combinedAnalysis;
        const singleAnalysis = result;

        persistSession(updateSession(session, {
          photos,
          analysis: singleAnalysis,
          combinedAnalysis,
          step: 'analysis',
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : '分析失败，请换一张清晰照片再试');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [detectPoseFromImage, persistSession]
  );

  useEffect(() => {
    const session = currentSession;
    if (session && shouldStartAnalysis(session) && !isAnalyzing) {
      void performAnalysis(session);
    }
  }, [currentSession, isAnalyzing, performAnalysis]);

  const handleRetry = useCallback(() => {
    setAppState(previous => ({ ...previous, currentSessionId: null }));
    setCurrentCaptureView(null);
    setError(null);
    navigateToStep('capture');
  }, [navigateToStep]);

  const handleProfileSubmit = useCallback(
    async (profile: UserProfile) => {
      if (!currentSession) {
        return;
      }
      const analysis = getSingleAnalysis(currentSession);
      const planSource = getDisplayAnalysis(currentSession);
      if (!analysis || !planSource) {
        return;
      }

      setIsCoachWorking(true);
      setError(null);

      const fixedProfile: UserProfile = { ...profile, coachGender: 'female' };
      const assistantDraft: CoachMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: getCurrentISOString(),
      };
      const sessionWithDraft = updateSession(currentSession, {
        profile: fixedProfile,
        plan: undefined,
        currentExerciseNames: [],
        completedExerciseNames: currentSession.completedExerciseNames ?? [],
        generatedExerciseNames: currentSession.generatedExerciseNames ?? [],
        chatMessages: [assistantDraft],
        step: 'chat',
      });
      persistSession(sessionWithDraft, fixedProfile);
      navigateToStep('chat');

      try {
        const request = {
          analysis,
          profile: fixedProfile,
          sessionId: currentSession.id,
          currentExerciseNames: [],
          completedExerciseNames: currentSession.completedExerciseNames ?? [],
          generatedExerciseNames: currentSession.generatedExerciseNames ?? [],
        };
        let streamedContent = '';
        const updateAssistantDraft = (content: string) => {
          persistSession(updateSession(sessionWithDraft, {
            chatMessages: [{ ...assistantDraft, content }],
          }));
        };
        const coachMessage = coachClient.generatePlanMessageStream
          ? await coachClient.generatePlanMessageStream(request, delta => {
            streamedContent += delta;
            updateAssistantDraft(streamedContent);
          })
          : await coachClient.generatePlanMessage(request);
        const plan = extractTrainingPlanFromMessage(coachMessage.content, currentSession.id, planSource.primaryIssue);
        const currentExerciseNames = plan?.exercises.map(exercise => exercise.name) ?? [];
        const generatedExerciseNames = uniqueNames([...(currentSession.generatedExerciseNames ?? []), ...currentExerciseNames]);
        if (coachMessage.fallbackReason) {
          setError(`Coze 教练连接失败，已临时回退 Mock：${coachMessage.fallbackReason}`);
        }
        const nextSession = updateSession(sessionWithDraft, {
          plan: plan ?? undefined,
          currentExerciseNames,
          generatedExerciseNames,
          chatMessages: [{ ...coachMessage, id: assistantDraft.id }],
          step: 'chat',
        });
        persistSession(nextSession, fixedProfile);
      } catch (err) {
        persistSession(updateSession(sessionWithDraft, { chatMessages: [] }));
        setError(err instanceof Error ? err.message : '教练生成计划失败');
      } finally {
        setIsCoachWorking(false);
      }
    },
    [currentSession, navigateToStep, persistSession]
  );

  const handleRequestNewPlan = useCallback(
    async () => {
      if (!currentSession?.profile) {
        return;
      }
      const analysis = getSingleAnalysis(currentSession);
      const planSource = getDisplayAnalysis(currentSession);
      if (!analysis || !planSource) {
        return;
      }

      setIsCoachWorking(true);
      setError(null);
      const userMessage: CoachMessage = {
        id: generateId(),
        role: 'user',
        content: '换一组训练',
        createdAt: getCurrentISOString(),
      };
      const assistantDraft: CoachMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: getCurrentISOString(),
      };
      const currentExerciseNames = getExerciseNames(currentSession);
      const messagesWithDraft = [...currentSession.chatMessages, userMessage, assistantDraft];
      const sessionWithDraft = updateSession(currentSession, {
        chatMessages: messagesWithDraft,
        currentExerciseNames,
        step: 'chat',
      });
      persistSession(sessionWithDraft);

      try {
        const request = {
          analysis,
          profile: currentSession.profile,
          sessionId: currentSession.id,
          currentExerciseNames,
          completedExerciseNames: currentSession.completedExerciseNames ?? [],
          generatedExerciseNames: currentSession.generatedExerciseNames ?? [],
        };
        let streamedContent = '';
        const updateAssistantDraft = (content: string) => {
          persistSession(updateSession(sessionWithDraft, {
            chatMessages: [...currentSession.chatMessages, userMessage, { ...assistantDraft, content }],
          }));
        };
        const coachMessage = coachClient.generatePlanMessageStream
          ? await coachClient.generatePlanMessageStream(request, delta => {
            streamedContent += delta;
            updateAssistantDraft(streamedContent);
          })
          : await coachClient.generatePlanMessage(request);
        const plan = extractTrainingPlanFromMessage(coachMessage.content, currentSession.id, planSource.primaryIssue);
        const nextExerciseNames = plan?.exercises.map(exercise => exercise.name) ?? currentExerciseNames;
        const generatedExerciseNames = uniqueNames([...(currentSession.generatedExerciseNames ?? []), ...nextExerciseNames]);
        persistSession(updateSession(sessionWithDraft, {
          plan: plan ?? currentSession.plan,
          currentExerciseNames: nextExerciseNames,
          generatedExerciseNames,
          chatMessages: [...currentSession.chatMessages, userMessage, { ...coachMessage, id: assistantDraft.id }],
        }));
        if (coachMessage.fallbackReason) {
          setError(`Coze 教练连接失败，已临时回退 Mock：${coachMessage.fallbackReason}`);
        }
      } catch (err) {
        persistSession(updateSession(sessionWithDraft, { chatMessages: [...currentSession.chatMessages, userMessage] }));
        setError(err instanceof Error ? err.message : '教练生成新计划失败');
      } finally {
        setIsCoachWorking(false);
      }
    },
    [currentSession, persistSession]
  );

  const handleFeedback = useCallback(
    async (feedback: CheckInFeedback, feedbackText?: string) => {
      if (!currentSession?.profile) {
        return;
      }

      setIsCoachWorking(true);
      setError(null);
      const userMessage = getUserFeedbackMessage(feedback, feedbackText);
      const messagesWithUser = [...currentSession.chatMessages, userMessage];
      const assistantDraft: CoachMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: getCurrentISOString(),
      };
      const currentExerciseNames = getExerciseNames(currentSession);
      const completedExerciseNames = feedback === 'completed' && !feedbackText?.trim()
        ? uniqueNames([...(currentSession.completedExerciseNames ?? []), ...currentExerciseNames])
        : currentSession.completedExerciseNames ?? [];
      const sessionWithDraft = updateSession(currentSession, {
        chatMessages: [...messagesWithUser, assistantDraft],
        currentExerciseNames,
        completedExerciseNames,
        step: 'chat',
      });
      persistSession(sessionWithDraft);

      try {
        const request = {
          profile: currentSession.profile,
          plan: currentSession.plan,
          sessionId: currentSession.id,
          analysis: getSingleAnalysis(currentSession) ?? undefined,
          feedback,
          feedbackText,
          previousMessages: messagesWithUser,
          currentExerciseNames,
          completedExerciseNames,
          generatedExerciseNames: currentSession.generatedExerciseNames ?? [],
        };
        let streamedContent = '';
        const updateAssistantDraft = (content: string) => {
          persistSession(updateSession(sessionWithDraft, {
            chatMessages: [...messagesWithUser, { ...assistantDraft, content }],
          }));
        };
        const coachMessage = coachClient.respondToFeedbackStream
          ? await coachClient.respondToFeedbackStream(request, delta => {
            streamedContent += delta;
            updateAssistantDraft(streamedContent);
          })
          : await coachClient.respondToFeedback(request);
        persistSession(updateSession(sessionWithDraft, {
          chatMessages: [...messagesWithUser, { ...coachMessage, id: assistantDraft.id }],
          completedExerciseNames,
        }));
        if (coachMessage.fallbackReason) {
          setError(`Coze 教练连接失败，已临时回退 Mock：${coachMessage.fallbackReason}`);
        }
      } catch (err) {
        persistSession(updateSession(sessionWithDraft, { chatMessages: messagesWithUser }));
        setError(err instanceof Error ? err.message : '教练反馈失败');
      } finally {
        setIsCoachWorking(false);
      }
    },
    [currentSession, persistSession]
  );

  const handleSelectHistory = useCallback(
    (sessionId: string) => {
      const session = appState.sessions.find(item => item.id === sessionId);
      if (!session) {
        return;
      }
      setAppState(previous => ({ ...previous, currentSessionId: sessionId }));
      setCaptureMode(session.captureMode);
      setViewSelection(session.viewSelection);
      setCurrentCaptureView(null);
      setError(null);
      navigateToStep(session.step);
    },
    [appState.sessions, navigateToStep]
  );

  const photos = currentSession?.photos ?? [];
  const frontAnalysis = photos.find(photo => photo.view === 'front')?.analysis ?? null;
  const sideAnalysis = photos.find(photo => photo.view === 'side')?.analysis ?? null;
  const combinedResult = currentSession?.combinedAnalysis ?? (frontAnalysis || sideAnalysis ? combineAnalyses(frontAnalysis, sideAnalysis) : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-cyan-50">
      <header className="bg-white/85 shadow-card backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-primary-700">PostureFit</h1>
              <p className="mt-0.5 text-sm text-primary-500">AI体态矫正运动搭子</p>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <StepIndicator
                currentStep={currentStep}
                canEnterStep={step => canEnterStep(currentSession, step)}
                onStepSelect={moveToStep}
              />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100 lg:w-80">
                <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${getStepProgress(currentStep)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto gap-6 px-4 py-8 ${
          currentStep === 'chat'
            ? 'grid max-w-7xl lg:grid-cols-1'
            : 'grid max-w-6xl lg:grid-cols-[minmax(0,1fr)_300px]'
        }`}
      >
        <section className="min-w-0">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-white p-4 text-sm leading-6 text-red-600 shadow-card">
              {error}
            </div>
          )}

          {currentStep === 'capture' && (
            <section className="rounded-2xl bg-white p-5 shadow-card">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">第一步</p>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-900">拍摄体态照片</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-gray-500">建议使用双视角，正面和侧面都会进入同一分析管线。</p>
              </div>
              <CameraCapture
                onCapture={handleCapture}
                selectedMode={captureMode}
                onModeChange={setCaptureMode}
                onUploadImage={handleUpload}
                viewSelection={viewSelection}
                onViewSelectionChange={setViewSelection}
                currentCaptureView={viewSelection === 'dual' ? currentCaptureView : null}
                onResetCapture={handleResetCapture}
                showViewSelection
              />
            </section>
          )}

          {currentStep === 'analysis' && (
            <section className="space-y-6">
              {isAnalyzing || isModelLoading ? (
                <div className="mx-auto max-w-lg rounded-2xl bg-white p-4 shadow-card">
                  <AnalysisLoader message={isModelLoading ? '正在加载AI模型...' : '正在分析体态...'} />
                </div>
              ) : combinedResult ? (
                <>
                  {currentSession?.viewSelection === 'dual' && photos.length >= 2 ? (
                    <CombinedAnalysisView
                      frontAnalysis={frontAnalysis}
                      sideAnalysis={sideAnalysis}
                      combinedResult={combinedResult}
                      showDualViews
                      frontImageUrl={photos.find(photo => photo.view === 'front')?.imageUrl ?? ''}
                      sideImageUrl={photos.find(photo => photo.view === 'side')?.imageUrl ?? ''}
                    />
                  ) : (
                    <CombinedAnalysisView
                      frontAnalysis={frontAnalysis}
                      sideAnalysis={sideAnalysis}
                      combinedResult={combinedResult}
                      showDualViews={false}
                      frontImageUrl={photos.find(photo => photo.view === 'front')?.imageUrl ?? photos[0]?.imageUrl ?? ''}
                      sideImageUrl={photos.find(photo => photo.view === 'side')?.imageUrl ?? ''}
                    />
                  )}

                  <div className="mx-auto flex max-w-2xl flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => moveToStep('profile')}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary-500 px-6 py-4 text-base font-medium text-white transition hover:bg-primary-600"
                    >
                      继续选择教练
                      <ArrowRight className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gray-50 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-100"
                    >
                      <RotateCcw className="h-4 w-4" />
                      重新拍摄
                    </button>
                  </div>
                </>
              ) : null}
            </section>
          )}

          {currentStep === 'profile' && (
            <ProfileForm
              initialProfile={currentSession?.profile ?? appState.preferences}
              onSubmit={handleProfileSubmit}
              onBack={() => moveToStep('analysis')}
              isSubmitting={isCoachWorking}
            />
          )}

          {currentStep === 'chat' && currentSession && (
            <CoachChat
              messages={currentSession.chatMessages}
              plan={currentSession.plan}
              isResponding={isCoachWorking}
              onFeedback={handleFeedback}
              onRequestNewPlan={handleRequestNewPlan}
              onRestart={handleRetry}
            />
          )}
        </section>

        <div className={`space-y-6 lg:sticky lg:top-6 lg:self-start ${currentStep === 'chat' ? 'hidden' : ''}`}>
          <HistoryRail
            sessions={appState.sessions}
            currentSessionId={appState.currentSessionId}
            onSelect={handleSelectHistory}
          />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/capture" replace />} />
        <Route path="/capture" element={<AppShell />} />
        <Route path="/analysis" element={<AppShell />} />
        <Route path="/profile" element={<AppShell />} />
        <Route path="/chat" element={<AppShell />} />
        <Route path="/plan" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<Navigate to="/capture" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
