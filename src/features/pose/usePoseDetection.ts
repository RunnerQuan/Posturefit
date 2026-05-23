import { useState, useCallback, useEffect, useRef } from 'react';
import { createPoseDetector, detectPose, disposeDetector, isDetectorReady, type MoveNetModelType } from './poseDetector';
import { normalizeMoveNetKeypoints, areKeypointsValid } from './normalizeKeypoints';
import type { PoseKeypoint17 } from '../../types';

const POSE_OPERATION_TIMEOUT_MS = 20_000;
const POSE_OPERATION_TIMEOUT_MESSAGE = '模型加载或姿态检测超时，请重新拍摄或刷新页面后重试';

export type UsePoseDetectionResult = {
  isModelLoading: boolean;
  isDetecting: boolean;
  error: string | null;
  detectPoseFromImage: (imageUrl: string) => Promise<PoseKeypoint17[]>;
  detectPoseFromElement: (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => Promise<PoseKeypoint17[]>;
  modelType: MoveNetModelType;
  setModelType: (type: MoveNetModelType) => void;
};

function withTimeout<T>(operation: Promise<T>, timeoutMs: number = POSE_OPERATION_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(POSE_OPERATION_TIMEOUT_MESSAGE));
    }, timeoutMs);

    operation
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

export function usePoseDetection(
  autoInit: boolean = true,
  modelType: MoveNetModelType = 'SinglePose.Lightning'
): UsePoseDetectionResult {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModelType, setCurrentModelType] = useState<MoveNetModelType>(modelType);
  const isInitialized = useRef(false);
  const initPromise = useRef<Promise<void> | null>(null);

  const initializeModel = useCallback(async () => {
    if (isInitialized.current && isDetectorReady()) {
      return;
    }

    if (isInitialized.current && !isDetectorReady()) {
      isInitialized.current = false;
      initPromise.current = null;
    }

    if (initPromise.current) {
      return initPromise.current;
    }

    setIsModelLoading(true);
    setError(null);

    initPromise.current = (async () => {
      try {
        await withTimeout(createPoseDetector({ modelType: currentModelType }));
        isInitialized.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '模型初始化失败');
        isInitialized.current = false;
        initPromise.current = null;
        throw err;
      } finally {
        setIsModelLoading(false);
      }
    })();

    return initPromise.current;
  }, [currentModelType]);

  const detectPoseFromImage = useCallback(async (imageUrl: string): Promise<PoseKeypoint17[]> => {
    setIsDetecting(true);
    setError(null);

    try {
      await initializeModel();

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('图片加载失败'));
          img.src = imageUrl;
        })
      );

      const rawPose = await withTimeout(detectPose(img, false));
      const keypoints = normalizeMoveNetKeypoints(rawPose.keypoints);

      if (!areKeypointsValid(keypoints)) {
        throw new Error('检测到的关键点不足，请确保图片中包含清晰的人体');
      }

      return keypoints;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '姿态检测失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDetecting(false);
    }
  }, [initializeModel]);

  const detectPoseFromElement = useCallback(
    async (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<PoseKeypoint17[]> => {
      setIsDetecting(true);
      setError(null);

      try {
        await initializeModel();

        const rawPose = await withTimeout(detectPose(element, false));
        const keypoints = normalizeMoveNetKeypoints(rawPose.keypoints);

        if (!areKeypointsValid(keypoints)) {
          throw new Error('检测到的关键点不足，请确保身体在画面中清晰可见');
        }

        return keypoints;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '姿态检测失败';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsDetecting(false);
      }
    },
    [initializeModel]
  );

  const setModelType = useCallback((type: MoveNetModelType) => {
    if (type !== currentModelType) {
      setCurrentModelType(type);
      isInitialized.current = false;
      initPromise.current = null;
      disposeDetector();
    }
  }, [currentModelType]);

  useEffect(() => {
    if (autoInit) {
      initializeModel();
    }

    return () => {
      disposeDetector();
      isInitialized.current = false;
      initPromise.current = null;
    };
  }, [autoInit, initializeModel]);

  return {
    isModelLoading,
    isDetecting,
    error,
    detectPoseFromImage,
    detectPoseFromElement,
    modelType: currentModelType,
    setModelType,
  };
}
