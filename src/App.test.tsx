import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { PoseKeypoint17 } from './types';
import { usePoseDetection } from './features/pose';
import type { UsePoseDetectionResult } from './features/pose';

vi.mock('./features/camera', () => ({
  CameraCapture: ({
    onUploadImage,
    onModeChange,
  }: {
    onUploadImage: (imageDataUrl: string) => void;
    onModeChange: (mode: string) => void;
  }) => (
    <>
      <button type="button" onClick={() => onModeChange('closeUp')}>
        特写
      </button>
      <button type="button" onClick={() => onUploadImage(`data:image/${Date.now()}`)}>
        mock upload
      </button>
    </>
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

vi.mock('./features/pose', () => ({
  usePoseDetection: vi.fn(),
}));

const mockUsePoseDetection = vi.mocked(usePoseDetection);

const pose: PoseKeypoint17[] = [
  { name: 'nose', x: 100, y: 40, score: 0.95 },
  { name: 'leftEye', x: 95, y: 35, score: 0.95 },
  { name: 'rightEye', x: 105, y: 35, score: 0.95 },
  { name: 'leftEar', x: 100, y: 45, score: 0.95 },
  { name: 'rightEar', x: 104, y: 45, score: 0.95 },
  { name: 'leftShoulder', x: 100, y: 100, score: 0.95 },
  { name: 'rightShoulder', x: 106, y: 100, score: 0.95 },
  { name: 'leftElbow', x: 100, y: 150, score: 0.95 },
  { name: 'rightElbow', x: 106, y: 150, score: 0.95 },
  { name: 'leftWrist', x: 100, y: 200, score: 0.95 },
  { name: 'rightWrist', x: 106, y: 200, score: 0.95 },
  { name: 'leftHip', x: 100, y: 210, score: 0.95 },
  { name: 'rightHip', x: 106, y: 210, score: 0.95 },
  { name: 'leftKnee', x: 100, y: 320, score: 0.95 },
  { name: 'rightKnee', x: 106, y: 320, score: 0.95 },
  { name: 'leftAnkle', x: 100, y: 430, score: 0.95 },
  { name: 'rightAnkle', x: 106, y: 430, score: 0.95 },
];

describe('App analysis flow', () => {
  beforeEach(() => {
    mockUsePoseDetection.mockReset();
  });

  it('clears stale analysis and starts a fresh run after returning from the profile step', async () => {
    const detectPoseFromImage = vi
      .fn<UsePoseDetectionResult['detectPoseFromImage']>()
      .mockResolvedValueOnce(pose)
      .mockReturnValueOnce(new Promise<PoseKeypoint17[]>(() => {}));

    mockUsePoseDetection.mockReturnValue({
      isModelLoading: false,
      isDetecting: false,
      error: null,
      detectPoseFromImage,
      detectPoseFromElement: vi.fn(),
      modelType: 'SinglePose.Lightning',
      setModelType: vi.fn(),
    });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'mock upload' }));

    await screen.findByText('分析结果');
    fireEvent.click(screen.getByRole('button', { name: '继续选择教练' }));
    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    fireEvent.click(screen.getByRole('button', { name: 'mock upload' }));

    await waitFor(() => expect(detectPoseFromImage).toHaveBeenCalledTimes(2));
    expect(detectPoseFromImage).toHaveBeenLastCalledWith(expect.any(String), 'fullBody');
    expect(screen.queryByText('分析结果')).not.toBeInTheDocument();
    expect(screen.getByText('正在分析体态...')).toBeInTheDocument();
  });

  it('shows a full-body guidance error when fullBody validation fails', async () => {
    const detectPoseFromImage = vi
      .fn<UsePoseDetectionResult['detectPoseFromImage']>()
      .mockRejectedValue(new Error('请上传完整全身照片，确保头部、肩部、髋部、膝盖和脚踝都在画面内'));

    mockUsePoseDetection.mockReturnValue({
      isModelLoading: false,
      isDetecting: false,
      error: null,
      detectPoseFromImage,
      detectPoseFromElement: vi.fn(),
      modelType: 'SinglePose.Lightning',
      setModelType: vi.fn(),
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'mock upload' }));

    expect(await screen.findByText('请上传完整全身照片，确保头部、肩部、髋部、膝盖和脚踝都在画面内')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新拍摄' })).toBeInTheDocument();
  });

  it('passes closeUp mode through analysis and hides unsupported metrics', async () => {
    const closeUpPose = pose.map(keypoint =>
      ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'].includes(keypoint.name)
        ? { ...keypoint, score: 0 }
        : keypoint
    );
    const detectPoseFromImage = vi
      .fn<UsePoseDetectionResult['detectPoseFromImage']>()
      .mockResolvedValue(closeUpPose);

    mockUsePoseDetection.mockReturnValue({
      isModelLoading: false,
      isDetecting: false,
      error: null,
      detectPoseFromImage,
      detectPoseFromElement: vi.fn(),
      modelType: 'SinglePose.Lightning',
      setModelType: vi.fn(),
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '特写' }));
    fireEvent.click(screen.getByRole('button', { name: 'mock upload' }));

    await screen.findByText('分析结果');
    expect(detectPoseFromImage).toHaveBeenCalledWith(expect.any(String), 'closeUp');
    expect(screen.getByText('头前伸')).toBeInTheDocument();
    expect(screen.queryByText('圆肩')).not.toBeInTheDocument();
    expect(screen.queryByText('骨盆前倾')).not.toBeInTheDocument();
  });
});
