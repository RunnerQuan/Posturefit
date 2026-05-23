import { useState, useCallback, useEffect, useRef } from 'react';
import { createPoseDetector, detectPose, disposeDetector, type MoveNetModelType } from './poseDetector';
import { normalizeMoveNetKeypoints, areKeypointsValid } from './normalizeKeypoints';
import type { PoseKeypoint17 } from '../../types';

export type UsePoseDetectionResult = {
  isModelLoading: boolean;
  isDetecting: boolean;
  error: string | null;
  detectPoseFromImage: (imageUrl: string, minKeypointCount?: number) => Promise<PoseKeypoint17[]>;
  detectPoseFromElement: (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, minKeypointCount?: number) => Promise<PoseKeypoint17[]>;
  modelType: MoveNetModelType;
  setModelType: (type: MoveNetModelType) => void;
};

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
    if (isInitialized.current) {
      return;
    }

    if (initPromise.current) {
      return initPromise.current;
    }

    setIsModelLoading(true);
    setError(null);

    initPromise.current = (async () => {
      try {
        await createPoseDetector({ modelType: currentModelType });
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

  const detectPoseFromImage = useCallback(async (
    imageUrl: string,
    minKeypointCount: number = 10
  ): Promise<PoseKeypoint17[]> => {
    setIsDetecting(true);
    setError(null);

    try {
      await initializeModel();

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = imageUrl;
      });

      const rawPose = await detectPose(img, false);
      const keypoints = normalizeMoveNetKeypoints(rawPose.keypoints);

      if (!areKeypointsValid(keypoints, 0.3, minKeypointCount)) {
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
    async (
      element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
      minKeypointCount: number = 10
    ): Promise<PoseKeypoint17[]> => {
      setIsDetecting(true);
      setError(null);

      try {
        await initializeModel();

        const rawPose = await detectPose(element, false);
        const keypoints = normalizeMoveNetKeypoints(rawPose.keypoints);

        if (!areKeypointsValid(keypoints, 0.3, minKeypointCount)) {
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
