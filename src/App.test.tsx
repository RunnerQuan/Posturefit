import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from './App';
import { usePoseDetection } from './features/pose';
import type { UsePoseDetectionResult } from './features/pose';
import type { PoseKeypoint33 } from './types';

vi.mock('./features/camera', () => ({
  CameraCapture: ({
    onUploadImage,
    onViewSelectionChange,
    viewSelection,
    currentCaptureView,
  }: {
    onUploadImage: (imageDataUrl: string, view: 'front' | 'side') => void;
    onViewSelectionChange: (view: 'front' | 'side' | 'dual') => void;
    viewSelection: 'front' | 'side' | 'dual';
    currentCaptureView?: 'front' | 'side' | null;
  }) => (
    <div>
      <button type="button" onClick={() => onViewSelectionChange('front')}>
        只拍正面
      </button>
      <button type="button" onClick={() => onViewSelectionChange('side')}>
        只拍侧面
      </button>
      <button
        type="button"
        onClick={() => onUploadImage(`data:image/front-${Date.now()}`, viewSelection === 'dual' && currentCaptureView === 'front' ? 'side' : viewSelection === 'dual' ? 'front' : viewSelection)}
      >
        上传正面样例
      </button>
      <button
        type="button"
        onClick={() => onUploadImage(`data:image/side-${Date.now()}`, viewSelection === 'dual' && currentCaptureView === 'front' ? 'side' : viewSelection === 'dual' ? 'front' : viewSelection)}
      >
        上传侧面样例
      </button>
    </div>
  ),
}));

vi.mock('./features/analysis/SkeletonOverlay', () => ({
  SkeletonOverlay: ({ imageUrl }: { imageUrl: string }) => (
    <div data-testid="skeleton-overlay">{imageUrl}</div>
  ),
}));

vi.mock('./features/analysis', async importOriginal => {
  const actual = await importOriginal<typeof import('./features/analysis')>();
  return {
    ...actual,
    CombinedAnalysisView: actual.CombinedAnalysisView,
  };
});

vi.mock('./features/pose', async importOriginal => {
  const actual = await importOriginal<typeof import('./features/pose')>();
  return {
    ...actual,
    usePoseDetection: vi.fn(),
  };
});

const mockUsePoseDetection = vi.mocked(usePoseDetection);

function enterCaptureIfNeeded() {
  const startButton = screen.queryByRole('button', { name: '开始你的体态之旅 →' });
  if (startButton) {
    fireEvent.click(startButton);
  }
}

// Mock pose data in 33-point format (BlazePose)
const pose: PoseKeypoint33[] = [
  { name: 'nose', x: 0.5, y: 0.1, score: 0.95 },
  { name: 'left_eye_inner', x: 0.48, y: 0.09, score: 0.95 },
  { name: 'left_eye', x: 0.47, y: 0.09, score: 0.95 },
  { name: 'left_eye_outer', x: 0.46, y: 0.09, score: 0.95 },
  { name: 'right_eye_inner', x: 0.52, y: 0.09, score: 0.95 },
  { name: 'right_eye', x: 0.53, y: 0.09, score: 0.95 },
  { name: 'right_eye_outer', x: 0.54, y: 0.09, score: 0.95 },
  { name: 'left_ear', x: 0.45, y: 0.12, score: 0.95 },
  { name: 'right_ear', x: 0.55, y: 0.12, score: 0.95 },
  { name: 'mouth_left', x: 0.48, y: 0.15, score: 0.9 },
  { name: 'mouth_right', x: 0.52, y: 0.15, score: 0.9 },
  { name: 'left_shoulder', x: 0.4, y: 0.25, score: 0.95 },
  { name: 'right_shoulder', x: 0.6, y: 0.25, score: 0.95 },
  { name: 'left_elbow', x: 0.35, y: 0.4, score: 0.9 },
  { name: 'right_elbow', x: 0.65, y: 0.4, score: 0.9 },
  { name: 'left_wrist', x: 0.3, y: 0.55, score: 0.85 },
  { name: 'right_wrist', x: 0.7, y: 0.55, score: 0.85 },
  { name: 'left_pinky', x: 0.28, y: 0.56, score: 0.8 },
  { name: 'right_pinky', x: 0.72, y: 0.56, score: 0.8 },
  { name: 'left_index', x: 0.29, y: 0.54, score: 0.8 },
  { name: 'right_index', x: 0.71, y: 0.54, score: 0.8 },
  { name: 'left_thumb', x: 0.27, y: 0.52, score: 0.8 },
  { name: 'right_thumb', x: 0.73, y: 0.52, score: 0.8 },
  { name: 'left_hip', x: 0.45, y: 0.55, score: 0.95 },
  { name: 'right_hip', x: 0.55, y: 0.55, score: 0.95 },
  { name: 'left_knee', x: 0.45, y: 0.75, score: 0.95 },
  { name: 'right_knee', x: 0.55, y: 0.75, score: 0.95 },
  { name: 'left_ankle', x: 0.45, y: 0.95, score: 0.9 },
  { name: 'right_ankle', x: 0.55, y: 0.95, score: 0.9 },
  { name: 'left_heel', x: 0.43, y: 0.96, score: 0.85 },
  { name: 'right_heel', x: 0.53, y: 0.96, score: 0.85 },
  { name: 'left_foot_index', x: 0.48, y: 0.98, score: 0.8 },
  { name: 'right_foot_index', x: 0.58, y: 0.98, score: 0.8 },
];

describe('App frontend B flow', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState(null, '', '/');
    mockUsePoseDetection.mockReset();
    mockUsePoseDetection.mockReturnValue({
      isModelLoading: false,
      isDetecting: false,
      error: null,
      detectPoseFromImage: vi.fn<UsePoseDetectionResult['detectPoseFromImage']>().mockResolvedValue(pose),
      detectPoseFromElement: vi.fn(),
      modelType: 'BlazePose',
      setModelType: vi.fn(),
    });
  });

  it('runs upload, analysis, profile, chat plan, and check-in feedback', async () => {
    render(<App />);

    enterCaptureIfNeeded();
    fireEvent.click(screen.getByRole('button', { name: '只拍侧面' }));
    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));

    await screen.findByText('分析结果');
    expect(screen.getByTestId('skeleton-overlay')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /继续选择教练/ }));
    expect(await screen.findByText('定制你的 AI 运动教练')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('例如：改善圆肩、缓解久坐酸痛'), {
      target: { value: '改善圆肩' },
    });
    fireEvent.click(screen.getByRole('button', { name: '进入 AI 陪练' }));

    expect(await screen.findByText('历史评估')).toBeInTheDocument();
    expect(screen.queryByText('AI 陪练')).not.toBeInTheDocument();
    expect(screen.queryByText(/今天完成 3 个动作了吗/)).not.toBeInTheDocument();
    expect(screen.getAllByText('肩胛骨后缩').length).toBeGreaterThan(0);
    expect(screen.getByText('历史评估')).toBeInTheDocument();
    expect(screen.getByText('本次评估')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '做完了' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '太累了' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '换一组训练' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '新建评估' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: '做完了' }));
    await waitFor(() => expect(screen.getAllByText('做完了').length).toBeGreaterThan(1));
    expect(await screen.findByText(/太厉害了|已完成|哇哦/)).toBeInTheDocument();
  });

  it('persists a session into localStorage after analysis', async () => {
    render(<App />);

    enterCaptureIfNeeded();
    fireEvent.click(screen.getByRole('button', { name: '只拍侧面' }));
    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));
    await screen.findByText('分析结果');

    await waitFor(() => {
      const stored = localStorage.getItem('posturefit.appState.v1');
      expect(stored).toContain('sessions');
    });
  });

  it('drops stale front analysis when switching a session to side-only mode', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /开始你的体态之旅/ }));
    fireEvent.click(screen.getByRole('button', { name: '只拍正面' }));
    fireEvent.click(screen.getByRole('button', { name: '上传正面样例' }));

    await screen.findByText('分析结果');
    expect(screen.getByText('高低肩')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '拍照' }));
    fireEvent.click(screen.getByRole('button', { name: '只拍侧面' }));
    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));

    await waitFor(() => {
      expect(screen.queryByText('高低肩')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('骨盆侧倾')).not.toBeInTheDocument();
    expect(screen.queryByText('膝内扣')).not.toBeInTheDocument();
    expect(screen.queryByText('头部偏移')).not.toBeInTheDocument();
    expect(screen.queryByText('重心偏移')).not.toBeInTheDocument();
    expect(screen.queryByText('骨盆前倾')).not.toBeInTheDocument();
    expect(screen.getAllByText('头前伸').length).toBeGreaterThan(0);

    const stored = localStorage.getItem('posturefit.appState.v1');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored ?? '{}');
    const session = parsed.sessions.find((item: { id: string }) => item.id === parsed.currentSessionId);
    expect(session.viewSelection).toBe('side');
    expect(session.photos.map((photo: { view: string }) => photo.view)).toEqual(['side']);
    expect(session.combinedAnalysis).toBeUndefined();
    expect(session.analysis.view).toBe('side');
    expect(session.analysis.issues.map((issue: { type: string }) => issue.type)).not.toContain('shoulderImbalance');
  });

  it('starts a brand new evaluation when uploading from capture after entering chat', async () => {
    render(<App />);

    enterCaptureIfNeeded();
    fireEvent.click(screen.getByRole('button', { name: '只拍侧面' }));
    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));

    await screen.findByText('分析结果');
    fireEvent.click(screen.getByRole('button', { name: /继续选择教练/ }));
    await screen.findByText('定制你的 AI 运动教练');
    fireEvent.change(screen.getByPlaceholderText('例如：改善圆肩、缓解久坐酸痛'), {
      target: { value: '改善圆肩' },
    });
    fireEvent.click(screen.getByRole('button', { name: '进入 AI 陪练' }));
    await screen.findByText('历史评估');

    const storedBefore = JSON.parse(localStorage.getItem('posturefit.appState.v1') ?? '{}');
    const previousSessionId = storedBefore.currentSessionId;
    const previousSessionCount = storedBefore.sessions.length;

    fireEvent.click(screen.getByRole('button', { name: '拍照' }));
    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));

    await screen.findByText('分析结果');

    const storedAfter = JSON.parse(localStorage.getItem('posturefit.appState.v1') ?? '{}');
    expect(storedAfter.currentSessionId).not.toBe(previousSessionId);
    expect(storedAfter.sessions).toHaveLength(previousSessionCount + 1);

    const newSession = storedAfter.sessions.find((item: { id: string }) => item.id === storedAfter.currentSessionId);
    const oldSession = storedAfter.sessions.find((item: { id: string }) => item.id === previousSessionId);

    expect(newSession.profile).toBeUndefined();
    expect(newSession.plan).toBeUndefined();
    expect(newSession.chatMessages).toEqual([]);
    expect(newSession.photos).toHaveLength(1);
    expect(newSession.analysis.view).toBe('side');
    expect(oldSession.chatMessages.length).toBeGreaterThan(0);
    expect(oldSession.profile.userGoal).toBe('改善圆肩');
  });

  it('shows only complete chat sessions in the chat history sidebar', async () => {
    const now = new Date().toISOString();
    localStorage.setItem('posturefit.appState.v1', JSON.stringify({
      currentSessionId: 'complete-session',
      schemaVersion: 2,
      sessions: [
        {
          id: 'complete-session',
          createdAt: now,
          updatedAt: now,
          step: 'chat',
          sourceType: 'upload',
          captureMode: 'fullBody',
          viewSelection: 'side',
          photos: [
            { id: 'complete-photo', view: 'side', imageUrl: 'data:image/complete', capturedAt: now },
          ],
          analysis: {
            keypoints: [],
            metrics: {
              forwardHeadAngle: 6,
              roundedShoulderAngle: 22,
              shoulderImbalanceAngle: 0,
              pelvicTiltAngle: 0,
              anteriorTiltAngle: 25,
              kneeValgusAngle: 0,
              headOffsetAngle: 0,
              centerOfGravityShiftAngle: 0,
              hunchbackAngle: 0,
              kneeHyperextensionAngle: 0,
              trunkLeanAngle: 0,
            },
            issues: [],
            primaryIssue: 'roundedShoulder',
            score: 80,
            analyzedAt: now,
            view: 'side',
          },
          profile: {
            coachStyle: 'strict',
            coachGender: 'female',
            userGoal: '改善圆肩',
            bodyState: 'normal',
          },
          chatMessages: [
            { id: 'm1', role: 'assistant', content: '完整记录', createdAt: now, source: 'mock' },
          ],
        },
        {
          id: 'pending-session',
          createdAt: now,
          updatedAt: now,
          step: 'analysis',
          sourceType: 'upload',
          captureMode: 'fullBody',
          viewSelection: 'side',
          photos: [
            { id: 'pending-photo', view: 'side', imageUrl: 'data:image/pending', capturedAt: now },
          ],
          analysis: {
            keypoints: [],
            metrics: {
              forwardHeadAngle: 6,
              roundedShoulderAngle: 22,
              shoulderImbalanceAngle: 0,
              pelvicTiltAngle: 0,
              anteriorTiltAngle: 25,
              kneeValgusAngle: 0,
              headOffsetAngle: 0,
              centerOfGravityShiftAngle: 0,
              hunchbackAngle: 0,
              kneeHyperextensionAngle: 0,
              trunkLeanAngle: 0,
            },
            issues: [],
            primaryIssue: 'forwardHead',
            score: 72,
            analyzedAt: now,
            view: 'side',
          },
          chatMessages: [],
        },
      ],
    }));
    window.history.pushState(null, '', '/chat');

    render(<App />);

    const historyPanel = await screen.findByText('历史评估');
    const historyAside = historyPanel.closest('aside');
    expect(historyAside).not.toBeNull();
    const historyQueries = within(historyAside as HTMLElement);
    expect(historyQueries.getByText('圆肩倾向')).toBeInTheDocument();
    expect(historyQueries.queryByText('头前伸')).not.toBeInTheDocument();
  });

  it('opens complete history records from chat on the chat page even when the saved step is analysis', async () => {
    const now = new Date().toISOString();
    localStorage.setItem('posturefit.appState.v1', JSON.stringify({
      currentSessionId: 'active-session',
      schemaVersion: 2,
      sessions: [
        {
          id: 'active-session',
          createdAt: now,
          updatedAt: now,
          step: 'chat',
          sourceType: 'upload',
          captureMode: 'fullBody',
          viewSelection: 'side',
          photos: [
            { id: 'active-photo', view: 'side', imageUrl: 'data:image/active', capturedAt: now },
          ],
          analysis: {
            keypoints: [],
            metrics: {
              forwardHeadAngle: 0,
              roundedShoulderAngle: 20,
              shoulderImbalanceAngle: 0,
              pelvicTiltAngle: 0,
              anteriorTiltAngle: 0,
              kneeValgusAngle: 0,
              headOffsetAngle: 0,
              centerOfGravityShiftAngle: 0,
              hunchbackAngle: 0,
              kneeHyperextensionAngle: 0,
              trunkLeanAngle: 0,
            },
            issues: [],
            primaryIssue: 'roundedShoulder',
            score: 82,
            analyzedAt: now,
            view: 'side',
          },
          profile: {
            coachStyle: 'strict',
            coachGender: 'female',
            userGoal: '改善圆肩',
            bodyState: 'normal',
          },
          chatMessages: [
            { id: 'active-message', role: 'assistant', content: '当前聊天', createdAt: now, source: 'mock' },
          ],
        },
        {
          id: 'history-session',
          createdAt: now,
          updatedAt: now,
          step: 'analysis',
          sourceType: 'upload',
          captureMode: 'fullBody',
          viewSelection: 'side',
          photos: [
            { id: 'history-photo', view: 'side', imageUrl: 'data:image/history', capturedAt: now },
          ],
          analysis: {
            keypoints: [],
            metrics: {
              forwardHeadAngle: 0,
              roundedShoulderAngle: 0,
              shoulderImbalanceAngle: 8,
              pelvicTiltAngle: 0,
              anteriorTiltAngle: 0,
              kneeValgusAngle: 0,
              headOffsetAngle: 0,
              centerOfGravityShiftAngle: 0,
              hunchbackAngle: 0,
              kneeHyperextensionAngle: 0,
              trunkLeanAngle: 0,
            },
            issues: [],
            primaryIssue: 'shoulderImbalance',
            score: 74,
            analyzedAt: now,
            view: 'side',
          },
          profile: {
            coachStyle: 'strict',
            coachGender: 'female',
            userGoal: '改善高低肩',
            bodyState: 'normal',
          },
          chatMessages: [
            { id: 'history-message', role: 'assistant', content: '历史聊天内容', createdAt: now, source: 'mock' },
          ],
        },
      ],
    }));
    window.history.pushState(null, '', '/chat');

    render(<App />);

    const historyPanel = await screen.findByText('历史评估');
    const historyAside = historyPanel.closest('aside') as HTMLElement;
    fireEvent.click(within(historyAside).getByText('高低肩'));

    await screen.findByText('历史聊天内容');
    expect(window.location.pathname).toBe('/chat');
    expect(screen.queryByText('分析结果')).not.toBeInTheDocument();
  });

  it('shows mobile chat entry points and opens summary sheet on small screens', async () => {
    const now = new Date().toISOString();
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });
    vi.mocked(window.matchMedia).mockImplementation(query => ({
      matches: query === '(max-width: 1023px)' || query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    localStorage.setItem('posturefit.appState.v1', JSON.stringify({
      currentSessionId: 'mobile-session',
      schemaVersion: 2,
      sessions: [
        {
          id: 'mobile-session',
          createdAt: now,
          updatedAt: now,
          step: 'chat',
          sourceType: 'upload',
          captureMode: 'fullBody',
          viewSelection: 'dual',
          photos: [],
          analysis: {
            keypoints: [],
            metrics: {
              forwardHeadAngle: 50,
              roundedShoulderAngle: 1,
              shoulderImbalanceAngle: 1,
              pelvicTiltAngle: 1,
              anteriorTiltAngle: 1,
              kneeValgusAngle: 1,
              headOffsetAngle: 1,
              centerOfGravityShiftAngle: 1,
              hunchbackAngle: 1,
              kneeHyperextensionAngle: 177,
              trunkLeanAngle: 0,
            },
            issues: [],
            primaryIssue: null,
            score: 98.6,
            analyzedAt: now,
            view: 'front',
          },
          combinedAnalysis: {
            allIssues: [],
            issuesByView: { front: [], side: [] },
            primaryIssue: null,
            score: 98.6,
            frontViewScore: { view: 'front', items: [], normalizedScore: 98.6 },
            sideViewScore: { view: 'side', items: [], normalizedScore: 98.6 },
            allScores: [],
            analyzedAt: now,
          },
          profile: {
            coachStyle: 'humorous',
            coachGender: 'female',
            userGoal: '改善体态',
            bodyState: 'fatigued',
          },
          plan: {
            id: 'plan-1',
            sessionId: 'mobile-session',
            primaryIssue: null,
            createdAt: now,
            intensity: 'low',
            exercises: [],
          },
          chatMessages: [
            { id: 'm1', role: 'assistant', content: '移动端测试消息', createdAt: now, source: 'mock' },
          ],
        },
      ],
    }));
    window.history.pushState(null, '', '/chat');

    render(<App />);

    expect(await screen.findByRole('button', { name: /历史评估/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /本次评估/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '新建评估' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /本次评估/ }));
    expect(await screen.findByRole('button', { name: '关闭面板' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '新建评估' })).toBeInTheDocument();
  });
});
