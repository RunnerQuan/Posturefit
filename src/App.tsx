import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { STEP_ORDER, canEnterStep, getStepProgress } from './app/stepMachine';
import { StepIndicator } from './components/StepIndicator';
import { AnalysisLoader } from './components/AnalysisLoader';
import { ISSUE_LABELS } from './data/exercises';
import { CameraCapture } from './features/camera';
import { SkeletonOverlay, analyzePose, combineAnalyses, CombinedAnalysisView } from './features/analysis';
import { usePoseDetection, validateKeypointsForMode, KEYPOINT_LABELS_33, MODE_MIN_KEYPOINTS } from './features/pose';
import { CoachChat } from './features/chat/CoachChat';
import { HistoryRail } from './features/history/HistoryRail';
import { ProfileForm } from './features/onboarding/ProfileForm';
import { generateTrainingPlan } from './features/plan/generateTrainingPlan';
import { PlanView } from './features/plan/PlanView';
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

function getIssueLabel(issue: PostureAnalysisResult['primaryIssue']): string {
  return issue ? ISSUE_LABELS[issue] : '体态维护';
}

function getUserFeedbackMessage(feedback: CheckInFeedback, feedbackText?: string): CoachMessage {
  return {
    id: generateId(),
    role: 'user',
    content: feedbackText?.trim() || (feedback === 'completed' ? '做完了' : '太累了'),
    createdAt: getCurrentISOString(),
  };
}

function getCoachChannelLabel(session: PostureSession | null): string {
  const latestAssistant = [...(session?.chatMessages ?? [])].reverse().find(message => message.role === 'assistant');
  if (latestAssistant?.source === 'coze') {
    return 'Coze 实时连接';
  }
  if (latestAssistant?.source === 'mock') {
    return latestAssistant.fallbackReason
      ? `Mock 回退：${latestAssistant.fallbackReason}`
      : 'Mock 演示';
  }
  return import.meta.env.VITE_COZE_ENABLED === 'true' ? 'Coze 已配置，等待请求' : 'Mock 演示';
}

const coachClient = createCoachClient();

const STEP_PATHS: Record<PostureSessionStep, string> = {
  capture: '/capture',
  analysis: '/analysis',
  profile: '/profile',
  plan: '/plan',
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

      try {
        const plan = generateTrainingPlan(currentSession.id, planSource, profile.bodyState);
        const coachMessage = await coachClient.generatePlanMessage({ analysis, profile, plan });
        if (coachMessage.fallbackReason) {
          setError(`Coze 教练连接失败，已临时回退 Mock：${coachMessage.fallbackReason}`);
        }
        const nextSession = updateSession(currentSession, {
          profile,
          plan,
          chatMessages: [coachMessage],
          step: 'plan',
        });
        persistSession(nextSession, profile);
        navigateToStep('plan');
      } catch (err) {
        setError(err instanceof Error ? err.message : '教练生成计划失败');
      } finally {
        setIsCoachWorking(false);
      }
    },
    [currentSession, navigateToStep, persistSession]
  );

  const handleFeedback = useCallback(
    async (feedback: CheckInFeedback, feedbackText?: string) => {
      if (!currentSession?.profile || !currentSession.plan) {
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
      const sessionWithDraft = updateSession(currentSession, {
        chatMessages: [...messagesWithUser, assistantDraft],
        step: 'chat',
      });
      persistSession(sessionWithDraft);

      try {
        const request = {
          profile: currentSession.profile,
          plan: currentSession.plan,
          analysis: getSingleAnalysis(currentSession) ?? undefined,
          feedback,
          feedbackText,
          previousMessages: messagesWithUser,
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
  const displayAnalysis = getDisplayAnalysis(currentSession);
  const primaryIssue = displayAnalysis?.primaryIssue ?? null;
  const score = 'score' in (displayAnalysis ?? {}) ? displayAnalysis?.score : undefined;

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

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
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
                    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-card">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-medium text-gray-700">分析结果</h3>
                        <div className="text-2xl font-bold text-gray-900">
                          {combinedResult.score}
                          <span className="ml-1 text-sm font-normal text-gray-400">分</span>
                        </div>
                      </div>
                      <div className="mb-6 overflow-hidden rounded-2xl bg-gray-900">
                        <SkeletonOverlay
                          result={getSingleAnalysis(currentSession)!}
                          imageUrl={photos[0]?.imageUrl ?? ''}
                          className="max-h-[400px]"
                        />
                      </div>
                      <div className="space-y-2">
                        {combinedResult.allIssues.map((issue, index) => (
                          <div key={`${issue.type}-${index}`} className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-700">
                            {issue.label}
                          </div>
                        ))}
                      </div>
                    </div>
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

          {currentStep === 'plan' && currentSession?.plan && (
            <PlanView
              plan={currentSession.plan}
              coachMessage={currentSession.chatMessages.find(message => message.role === 'assistant')}
              onStartTraining={() => moveToStep('chat')}
              onBack={() => moveToStep('profile')}
            />
          )}

          {currentStep === 'chat' && currentSession?.plan && (
            <CoachChat
              messages={currentSession.chatMessages}
              plan={currentSession.plan}
              isResponding={isCoachWorking}
              onFeedback={handleFeedback}
              onRestart={handleRetry}
            />
          )}
        </section>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary-500" />
              <h2 className="text-base font-semibold text-gray-800">当前状态</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>步骤：{STEP_ORDER.indexOf(currentStep) + 1} / {STEP_ORDER.length}</p>
              <p>主要问题：{getIssueLabel(primaryIssue)}</p>
              {typeof score === 'number' && <p>体态评分：{score}</p>}
              <p>教练通道：{getCoachChannelLabel(currentSession)}</p>
            </div>
          </section>

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
        <Route path="/plan" element={<AppShell />} />
        <Route path="/chat" element={<AppShell />} />
        <Route path="*" element={<Navigate to="/capture" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
