import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { PoseKeypoint17 } from './types';
import { usePoseDetection } from './features/pose';
import type { UsePoseDetectionResult } from './features/pose';

vi.mock('./features/camera', () => ({
  CameraCapture: ({ onUploadImage }: { onUploadImage: (imageDataUrl: string) => void }) => (
    <button type="button" onClick={() => onUploadImage(`data:image/${Date.now()}`)}>
      mock upload
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
    expect(screen.queryByText('分析结果')).not.toBeInTheDocument();
    expect(screen.getByText('正在分析体态...')).toBeInTheDocument();
  });
});
