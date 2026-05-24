import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { usePoseDetection } from './features/pose';
import type { UsePoseDetectionResult } from './features/pose';
import type { PoseKeypoint33 } from './types';

vi.mock('./features/camera', () => ({
  CameraCapture: ({
    onUploadImage,
  }: {
    onUploadImage: (imageDataUrl: string, view: 'front' | 'side') => void;
  }) => (
    <button type="button" onClick={() => onUploadImage(`data:image/${Date.now()}`, 'side')}>
      上传侧面样例
    </button>
  ),
}));

vi.mock('./features/analysis', async importOriginal => {
  const actual = await importOriginal<typeof import('./features/analysis')>();
  return {
    ...actual,
    SkeletonOverlay: ({ imageUrl }: { imageUrl: string }) => (
      <div data-testid="skeleton-overlay">{imageUrl}</div>
    ),
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

  it('runs upload, analysis, profile, plan, and check-in feedback', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));

    await screen.findByText('分析结果');
    expect(screen.getByTestId('skeleton-overlay')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /继续选择教练/ }));
    expect(await screen.findByText('选择你的专属教练')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('例如：改善圆肩、缓解久坐酸痛'), {
      target: { value: '改善圆肩' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成今日计划' }));

    expect(await screen.findByText('今日训练计划')).toBeInTheDocument();
    expect(screen.getAllByText('B站跟练参考')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: '去打卡' }));
    expect(await screen.findByText(/今天完成 3 个动作了吗/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '做完了' }));
    await waitFor(() => expect(screen.getAllByText('做完了').length).toBeGreaterThan(1));
    expect(await screen.findByText(/太厉害了|已完成|哇哦/)).toBeInTheDocument();
  });

  it('persists a session into localStorage after analysis', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '上传侧面样例' }));
    await screen.findByText('分析结果');

    await waitFor(() => {
      const stored = localStorage.getItem('posturefit.appState.v1');
      expect(stored).toContain('sessions');
    });
  });
});
