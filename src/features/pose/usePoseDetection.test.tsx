import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePoseDetection } from './usePoseDetection';

const poseDetectorMock = vi.hoisted(() => {
  return {
    detectorReady: false,
    createPoseDetector: vi.fn(),
    detectPose: vi.fn(),
    disposeDetector: vi.fn(),
    isDetectorReady: vi.fn(),
  };
});

vi.mock('./poseDetector', () => ({
  createPoseDetector: poseDetectorMock.createPoseDetector,
  detectPose: poseDetectorMock.detectPose,
  disposeDetector: poseDetectorMock.disposeDetector,
  isDetectorReady: poseDetectorMock.isDetectorReady,
}));

const rawKeypoints = Array.from({ length: 17 }, (_, index) => ({
  x: index * 10,
  y: index * 20,
  score: 0.95,
}));

describe('usePoseDetection', () => {
  beforeEach(() => {
    vi.useRealTimers();
    poseDetectorMock.detectorReady = false;
    poseDetectorMock.createPoseDetector.mockReset();
    poseDetectorMock.detectPose.mockReset();
    poseDetectorMock.disposeDetector.mockReset();
    poseDetectorMock.isDetectorReady.mockReset();

    poseDetectorMock.createPoseDetector.mockImplementation(async () => {
      poseDetectorMock.detectorReady = true;
      return {};
    });
    poseDetectorMock.detectPose.mockResolvedValue({ keypoints: rawKeypoints });
    poseDetectorMock.disposeDetector.mockImplementation(() => {
      poseDetectorMock.detectorReady = false;
    });
    poseDetectorMock.isDetectorReady.mockImplementation(() => poseDetectorMock.detectorReady);
  });

  it('reinitializes when the global detector has been disposed behind the hook state', async () => {
    const { result } = renderHook(() => usePoseDetection(false));
    const canvas = document.createElement('canvas');

    await act(async () => {
      await result.current.detectPoseFromElement(canvas);
    });

    poseDetectorMock.detectorReady = false;

    await act(async () => {
      await result.current.detectPoseFromElement(canvas);
    });

    expect(poseDetectorMock.createPoseDetector).toHaveBeenCalledTimes(2);
  });

  it('rejects stalled pose detection instead of staying in detecting state forever', async () => {
    vi.useFakeTimers();
    poseDetectorMock.detectPose.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePoseDetection(false));
    const canvas = document.createElement('canvas');
    let settledError: unknown;

    act(() => {
      void result.current.detectPoseFromElement(canvas).catch(error => {
        settledError = error;
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(settledError).toBeInstanceOf(Error);
    expect((settledError as Error).message).toBe('模型加载或姿态检测超时，请重新拍摄或刷新页面后重试');
    expect(result.current.isDetecting).toBe(false);

    vi.useRealTimers();
  });
});
