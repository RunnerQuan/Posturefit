import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, History, RotateCcw, X } from 'lucide-react';
import { STEP_ORDER, canEnterStep, getStepProgress } from './app/stepMachine';
import { StepIndicator } from './components/StepIndicator';
import { AnalysisLoader } from './components/AnalysisLoader';
import { CameraCapture } from './features/camera';
import { analyzePose, combineAnalyses, CombinedAnalysisView } from './features/analysis';
import { usePoseDetection, validateKeypointsForMode, KEYPOINT_LABELS_33, MODE_MIN_KEYPOINTS } from './features/pose';
import { CoachChat } from './features/chat/CoachChat';
import { SessionSummaryPanel } from './features/chat/SessionSummaryPanel';
import { SessionSidebar } from './features/history/SessionSidebar';
import { ProfileForm } from './features/onboarding/ProfileForm';
import { extractTrainingPlanFromMessage } from './features/chat/exerciseBlock';
import { createCoachClient } from './services/coach';
import { createSession, loadAppState, saveAppState, updateSession } from './services/storage/sessionStorage';
import { generateId } from './lib/ids';
import { getCurrentISOString } from './lib/time';
import { getSessionDisplayAnalysis, getSessionSingleAnalysis } from './lib/sessionAnalysis';
import { LandingPage } from './features/landing/LandingPage';
import logoImage from '../assets/logo.png';
import type {
  AppState,
  CaptureMode,
  CapturedPhoto,
  CheckInFeedback,
  CoachMessage,
  PoseView,
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

function getAllowedViews(viewSelection: ViewSelection): PoseView[] {
  return viewSelection === 'dual' ? ['front', 'side'] : [viewSelection];
}

function filterPhotosForViewSelection(photos: CapturedPhoto[], viewSelection: ViewSelection): CapturedPhoto[] {
  const allowedViews = getAllowedViews(viewSelection);
  return photos.filter(photo => allowedViews.includes(photo.view));
}

function shouldStartAnalysis(session: PostureSession | null): boolean {
  if (!session || session.step !== 'analysis') {
    return false;
  }
  const photos = filterPhotosForViewSelection(session.photos, session.viewSelection);
  return photos.length > 0 && photos.some(photo => !photo.analysis);
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

function isCaptureDraftSession(session: PostureSession | null): session is PostureSession {
  return Boolean(
    session &&
    session.step === 'capture' &&
    !session.analysis &&
    !session.combinedAnalysis &&
    !session.profile &&
    !session.plan &&
    session.chatMessages.length === 0
  );
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

function isMobileDeviceLayout(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  const hasTouch = navigator.maxTouchPoints > 0;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(navigator.userAgent);

  return (hasTouch && coarsePointer) || mobileUserAgent;
}

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(isMobileDeviceLayout);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const onChange = () => setIsMobile(isMobileDeviceLayout());

    setIsMobile(isMobileDeviceLayout());
    mediaQuery.addEventListener('change', onChange);
    window.addEventListener('resize', onChange);
    return () => {
      mediaQuery.removeEventListener('change', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, []);

  return isMobile;
}

type MobileChatPanelType = 'history' | 'summary' | null;

type MobileChatSheetProps = {
  openPanel: MobileChatPanelType;
  onClose: () => void;
  historyContent: React.ReactNode;
  summaryContent: React.ReactNode;
};

function MobileChatSheet({ openPanel, onClose, historyContent, summaryContent }: MobileChatSheetProps) {
  if (!openPanel) {
    return null;
  }

  const title = openPanel === 'history' ? '历史评估' : '本次评估';

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="关闭面板"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 top-[5.5rem] flex flex-col rounded-t-[30px] border border-white/60 bg-white/92 shadow-[0_-20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-blush-100/70 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-blush-700">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blush-50 text-blush-600 transition hover:bg-blush-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {openPanel === 'history' ? historyContent : summaryContent}
        </div>
      </div>
    </div>
  );
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
  const [mobileChatPanel, setMobileChatPanel] = useState<MobileChatPanelType>(null);
  const isMobileViewport = useIsMobileViewport();
  const { detectPoseFromImage, isModelLoading } = usePoseDetection();

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileChatPanel(null);
    }
  }, [isMobileViewport]);

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
      if (step === 'capture' && currentSession && !isCaptureDraftSession(currentSession)) {
        setAppState(previous => ({ ...previous, currentSessionId: null }));
        setCurrentCaptureView(null);
        setError(null);
        navigateToStep('capture');
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
      const baseSession = isCaptureDraftSession(currentSession)
        ? currentSession
        : createSession(sourceType, captureMode);
      const photos = viewSelection === 'dual'
        ? [...filterPhotosForViewSelection(baseSession.photos, viewSelection).filter(item => item.view !== view), photo]
        : [photo];
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
      const scopedPhotos = filterPhotosForViewSelection(session.photos, session.viewSelection);
      const photo = scopedPhotos.find(item => !item.analysis);
      if (!photo) {
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const minKeypointCount = MODE_MIN_KEYPOINTS[session.captureMode];
        const keypoints = await detectPoseFromImage(photo.imageUrl, minKeypointCount);
        const validation = validateKeypointsForMode(keypoints, session.captureMode, photo.view);

        if (!validation.isValid) {
          const missingLabels = validation.missingKeypoints?.map(keypoint => KEYPOINT_LABELS_33[keypoint]).join('、') || '';
          setError(`${validation.message}${missingLabels ? `\n缺失关键点：${missingLabels}` : ''}`);
          return;
        }

        const result = analyzePose(keypoints, {
          view: photo.view,
          captureMode: session.captureMode,
        });
        const photos = scopedPhotos.map(item => (item.id === photo.id ? { ...item, analysis: result } : item));
        const frontAnalysis = photos.find(item => item.view === 'front')?.analysis ?? null;
        const sideAnalysis = photos.find(item => item.view === 'side')?.analysis ?? null;
        const hasCompleteDualAnalysis = session.viewSelection === 'dual' && Boolean(frontAnalysis && sideAnalysis);
        const combinedAnalysis = hasCompleteDualAnalysis ? combineAnalyses(frontAnalysis, sideAnalysis) : undefined;
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
      const analysis = getSessionSingleAnalysis(currentSession);
      const planSource = getSessionDisplayAnalysis(currentSession);
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
          captureMode: currentSession.captureMode,
          viewSelection: currentSession.viewSelection,
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
      const analysis = getSessionSingleAnalysis(currentSession);
      const planSource = getSessionDisplayAnalysis(currentSession);
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
          captureMode: currentSession.captureMode,
          viewSelection: currentSession.viewSelection,
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
          analysis: getSessionSingleAnalysis(currentSession) ?? undefined,
          feedback,
          feedbackText,
          previousMessages: messagesWithUser,
          captureMode: currentSession.captureMode,
          viewSelection: currentSession.viewSelection,
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
      const nextStep = canEnterStep(session, 'chat') ? 'chat' : getLatestAllowedStep(session);
      setAppState(previous => ({
        ...previous,
        currentSessionId: sessionId,
        sessions: previous.sessions.map(item => (
          item.id === sessionId && item.step !== nextStep ? updateSession(item, { step: nextStep }) : item
        )),
      }));
      setCaptureMode(session.captureMode);
      setViewSelection(session.viewSelection);
      setCurrentCaptureView(null);
      setError(null);
      navigateToStep(nextStep);
    },
    [appState.sessions, navigateToStep]
  );

  const photos = currentSession ? filterPhotosForViewSelection(currentSession.photos, currentSession.viewSelection) : [];
  const frontAnalysis = photos.find(photo => photo.view === 'front')?.analysis ?? null;
  const sideAnalysis = photos.find(photo => photo.view === 'side')?.analysis ?? null;
  const combinedResult = currentSession?.combinedAnalysis ?? (frontAnalysis && sideAnalysis ? combineAnalyses(frontAnalysis, sideAnalysis) : null);
  const displayAnalysis = getSessionDisplayAnalysis(currentSession);
  const chatHistorySessions = useMemo(
    () => appState.sessions.filter(session => canEnterStep(session, 'chat')),
    [appState.sessions]
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 基础梦幻渐变背景 */}
      <div className="fixed inset-0 bg-dreamy pointer-events-none" />

      {/* 大型渐变浮泡 - 左上 */}
      <div
        className="fixed -top-16 -left-16 w-96 h-96 rounded-full pointer-events-none animate-float-slow"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(251, 207, 232, 0.6), rgba(233, 213, 255, 0.4), rgba(186, 230, 253, 0.2), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 大型渐变浮泡 - 右上 */}
      <div
        className="fixed -top-8 -right-24 w-80 h-80 rounded-full pointer-events-none animate-float-medium"
        style={{
          background: 'radial-gradient(circle at 60% 50%, rgba(196, 132, 252, 0.5), rgba(167, 139, 250, 0.3), rgba(244, 114, 182, 0.15), transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* 中型渐变浮泡 - 左下 */}
      <div
        className="fixed -bottom-12 left-1/4 w-72 h-72 rounded-full pointer-events-none animate-float-bubble"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.35), rgba(251, 207, 232, 0.25), rgba(196, 132, 252, 0.15), transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* 中型渐变浮泡 - 右下 */}
      <div
        className="fixed -bottom-8 right-1/4 w-64 h-64 rounded-full pointer-events-none animate-drift-left"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(125, 211, 252, 0.45), rgba(147, 197, 253, 0.3), rgba(196, 132, 252, 0.2), transparent 70%)',
          filter: 'blur(40px)',
          animationDelay: '-4s',
        }}
      />

      {/* 星光粒子 - 随机分布在页面各处 */}
      <div className="fixed top-32 left-1/3 w-2 h-2 rounded-full bg-blush-300 pointer-events-none animate-twinkle" style={{ animationDelay: '-0.5s', animationDuration: '6s' }} />
      <div className="fixed top-48 right-1/4 w-1.5 h-1.5 rounded-full bg-mist-300 pointer-events-none animate-twinkle" style={{ animationDelay: '-2s', animationDuration: '7s' }} />
      <div className="fixed top-72 left-1/5 w-1 h-1 rounded-full bg-sky-300 pointer-events-none animate-twinkle" style={{ animationDelay: '-4s', animationDuration: '5s' }} />
      <div className="fixed top-1/3 right-1/6 w-2 h-2 rounded-full bg-blush-200 pointer-events-none animate-twinkle" style={{ animationDelay: '-1s', animationDuration: '9s' }} />
      <div className="fixed bottom-40 left-1/6 w-1 h-1 rounded-full bg-mist-200 pointer-events-none animate-twinkle" style={{ animationDelay: '-3s', animationDuration: '8s' }} />
      <div className="fixed bottom-60 right-1/3 w-1.5 h-1.5 rounded-full bg-sky-200 pointer-events-none animate-twinkle" style={{ animationDelay: '-5s', animationDuration: '6.5s' }} />
      <div className="fixed top-2/3 left-1/2 w-1 h-1 rounded-full bg-blush-300 pointer-events-none animate-twinkle" style={{ animationDelay: '-6s', animationDuration: '7.5s' }} />
      <div className="fixed top-40 left-3/4 w-2 h-2 rounded-full bg-mist-300 pointer-events-none animate-twinkle" style={{ animationDelay: '-2.5s', animationDuration: '5.5s' }} />

      {/* 微光内层泡 - 漂浮在内容层之下 */}
      <div
        className="fixed top-1/4 left-1/2 w-48 h-48 rounded-full pointer-events-none animate-inner-bubble"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(251, 207, 232, 0.15), transparent 70%)',
          filter: 'blur(30px)',
          animationDelay: '-3s',
        }}
      />

      {/* 主内容区域 */}
      <div className="relative z-10 min-h-screen">
        {/* 头部导航 */}
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-soft">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex cursor-pointer items-center gap-3 rounded-2xl text-left transition hover:opacity-85 focus:outline-none focus-visible:ring-4 focus-visible:ring-blush-100"
                aria-label="返回首页"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-glow animate-glow-pulse">
                    <img src={logoImage} alt="" className="h-12 w-12 object-contain" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blush-400/20 to-mist-400/20 blur-sm -z-10" />
                </div>
                <div>
                  <h1 className="font-serif text-[1.7rem] font-semibold leading-none text-blush-600">PostureFit</h1>
                  <p className="mt-1 text-[0.95rem] leading-none text-mist-500">AI体态矫正运动教练</p>
                </div>
              </button>

              <div className="flex flex-col gap-2 lg:items-end">
                <StepIndicator
                  currentStep={currentStep}
                  canEnterStep={step => canEnterStep(currentSession, step)}
                  onStepSelect={moveToStep}
                />
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-blush-100/50 lg:w-80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blush-400 via-mist-400 to-sky-300 transition-all duration-500 ease-out"
                    style={{ width: `${getStepProgress(currentStep)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main
          className={`relative z-10 mx-auto gap-4 px-4 ${
            currentStep === 'chat'
              ? isMobileViewport
                ? 'flex w-full max-w-none flex-col py-4'
                : 'grid w-full max-w-none grid-cols-[300px_minmax(0,1fr)_340px] items-start gap-6 py-4'
              : 'max-w-5xl py-8'
          }`}
        >
          {currentStep === 'chat' && currentSession && !isMobileViewport && (
            <SessionSidebar
              sessions={chatHistorySessions}
              currentSessionId={appState.currentSessionId}
              onSelect={handleSelectHistory}
              className="h-[calc(100vh-10.5rem)] min-h-[600px]"
            />
          )}

          {/* 主内容区 */}
          <section className={`min-w-0 ${currentStep === 'chat' ? `flex min-h-0 flex-1 flex-col ${isMobileViewport ? 'gap-4' : 'gap-6'}` : 'space-y-6'}`}>
            {error && (
              <div className="rounded-2xl border border-red-200/50 bg-gradient-to-br from-red-50/90 to-orange-50/90 backdrop-blur-sm p-4 text-sm leading-6 text-red-600 shadow-soft">
                {error}
              </div>
            )}

            {currentStep === 'capture' && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-md px-5 pb-5 pt-3 shadow-soft border border-white/50">
                <div className="mb-3">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-blush-700 to-mist-600 bg-clip-text text-transparent">拍摄体态照片</h2>
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
                  <div className="mx-auto max-w-lg rounded-2xl bg-white/80 backdrop-blur-md p-4 shadow-soft border border-white/50">
                    <AnalysisLoader message={isModelLoading ? '正在加载AI模型...' : '正在分析体态...'} />
                  </div>
                ) : displayAnalysis ? (
                  <>
                    {currentSession?.viewSelection === 'dual' && combinedResult ? (
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
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blush-500 to-mist-500 px-10 py-4 text-lg font-semibold text-white transition hover:from-blush-600 hover:to-mist-600 shadow-bubble hover:shadow-glow"
                      >
                        继续选择教练
                        <ArrowRight className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/80 backdrop-blur-sm border border-blush-100 px-8 py-3.5 text-base font-medium text-blush-600 transition hover:bg-blush-50"
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
              <>
                {isMobileViewport && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileChatPanel('history')}
                      className="group flex cursor-pointer items-center justify-between rounded-[24px] border border-white/70 bg-white/88 px-4 py-4 text-left shadow-soft backdrop-blur-md transition hover:border-blush-200 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blush-500 to-mist-500 text-white shadow-bubble">
                          <History className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-blush-700">历史评估</p>
                          <p className="mt-0.5 text-xs text-mist-500">展开查看最近记录</p>
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-mist-400 transition group-hover:text-blush-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileChatPanel('summary')}
                      className="group flex cursor-pointer items-center justify-between rounded-[24px] border border-white/70 bg-white/88 px-4 py-4 text-left shadow-soft backdrop-blur-md transition hover:border-blush-200 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-bubble">
                          <ArrowRight className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-blush-700">本次评估</p>
                          <p className="mt-0.5 text-xs text-mist-500">展开查看评分与图片</p>
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-mist-400 transition group-hover:text-blush-500" />
                    </button>
                  </div>
                )}
              <CoachChat
                messages={currentSession.chatMessages}
                plan={currentSession.plan}
                isResponding={isCoachWorking}
                onFeedback={handleFeedback}
                onRequestNewPlan={handleRequestNewPlan}
                className={!isMobileViewport ? 'flex-none h-[calc(100vh-10.5rem)] min-h-[calc(100vh-10.5rem)]' : ''}
              />
              </>
            )}
          </section>

          {currentStep === 'chat' && currentSession && !isMobileViewport && (
            <SessionSummaryPanel session={currentSession} onRestart={handleRetry} className="h-[calc(100vh-10.5rem)] min-h-[600px]" />
          )}
        </main>
        {currentStep === 'chat' && currentSession && isMobileViewport && (
          <MobileChatSheet
            openPanel={mobileChatPanel}
            onClose={() => setMobileChatPanel(null)}
            historyContent={
              <SessionSidebar
                sessions={chatHistorySessions}
                currentSessionId={appState.currentSessionId}
                onSelect={sessionId => {
                  handleSelectHistory(sessionId);
                  setMobileChatPanel(null);
                }}
                className="h-full min-h-0 rounded-[24px]"
              />
            }
            summaryContent={<SessionSummaryPanel session={currentSession} onRestart={handleRetry} className="h-full min-h-0 rounded-[24px]" />}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/capture" element={<AppShell />} />
        <Route path="/analysis" element={<AppShell />} />
        <Route path="/profile" element={<AppShell />} />
        <Route path="/chat" element={<AppShell />} />
        <Route path="/plan" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
