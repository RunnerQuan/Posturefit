import { useState, useCallback, useEffect, useRef } from 'react';
import { createPoseDetector, detectPose, disposeDetector, isDetectorReady, type MoveNetModelType } from './poseDetector';
import { normalizeMoveNetKeypoints, validateKeypointsForMode } from './normalizeKeypoints';
import type { CaptureMode, PoseKeypoint17 } from '../../types';

const POSE_OPERATION_TIMEOUT_MS = 20_000;
const POSE_OPERATION_TIMEOUT_MESSAGE = '模型加载或姿态检测超时，请重新拍摄或刷新页面后重试';

export type UsePoseDetectionResult = {
  isModelLoading: boolean;
  isDetecting: boolean;
  error: string | null;
  detectPoseFromImage: (imageUrl: string, captureMode?: CaptureMode) => Promise<PoseKeypoint17[]>;
  detectPoseFromElement: (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, captureMode?: CaptureMode) => Promise<PoseKeypoint17[]>;
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
    console.log('[Hook:usePoseDetection] initializeModel called. isInitialized:', isInitialized.current, 'isDetectorReady:', isDetectorReady());
    
    if (isInitialized.current && isDetectorReady()) {
      console.log('[Hook:usePoseDetection] Model already initialized and ready, returning');
      return;
    }

    if (isInitialized.current && !isDetectorReady()) {
      console.log('[Hook:usePoseDetection] Marked as initialized but detector not ready, resetting...');
      isInitialized.current = false;
      initPromise.current = null;
    }

    if (initPromise.current) {
      console.log('[Hook:usePoseDetection] Initialization in progress, waiting...');
      return initPromise.current;
    }

    setIsModelLoading(true);
    setError(null);
    console.log('[Hook:usePoseDetection] Starting model initialization...');

    initPromise.current = (async () => {
      try {
        const startTime = performance.now();
        console.log('[Hook:usePoseDetection] Creating pose detector with model:', currentModelType);
        await withTimeout(createPoseDetector({ modelType: currentModelType }));
        const endTime = performance.now();
        isInitialized.current = true;
        console.log('[Hook:usePoseDetection] ✓ Model initialization complete in', (endTime - startTime).toFixed(2), 'ms');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '模型初始化失败';
        console.error('[Hook:usePoseDetection] Model initialization failed:', errorMsg);
        setError(errorMsg);
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
    captureMode: CaptureMode = 'fullBody'
  ): Promise<PoseKeypoint17[]> => {
    console.log('[Hook:usePoseDetection] detectPoseFromImage called with URL:', imageUrl.substring(0, 50) + '...');
    setIsDetecting(true);
    setError(null);

    try {
      console.log('[Hook:usePoseDetection] Initializing model...');
      await initializeModel();
      console.log('[Hook:usePoseDetection] Model initialized, loading image...');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadStartTime = performance.now();
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const loadTime = performance.now() - loadStartTime;
            console.log('[Hook:usePoseDetection] Image loaded in', loadTime.toFixed(2), 'ms');
            resolve();
          };
          img.onerror = () => {
            console.error('[Hook:usePoseDetection] Failed to load image');
            reject(new Error('图片加载失败'));
          };
          console.log('[Hook:usePoseDetection] Setting image source...');
          img.src = imageUrl;
        })
      );

      console.log('[Hook:usePoseDetection] Detecting pose from image...');
      const rawPose = await withTimeout(detectPose(img, false));
      console.log('[Hook:usePoseDetection] ✓ Raw pose detected, normalizing keypoints...');
      
      const keypoints = normalizeMoveNetKeypoints(rawPose.keypoints);
      console.log('[Hook:usePoseDetection] Keypoints normalized, count:', keypoints.length);

      const validation = validateKeypointsForMode(keypoints, captureMode);
      if (!validation.isValid) {
        console.warn('[Hook:usePoseDetection] Keypoints validation failed for mode:', captureMode);
        throw new Error(validation.message ?? '检测到的关键点不足，请确保图片中包含清晰的人体');
      }

      console.log('[Hook:usePoseDetection] ✓ Detection complete');
      return keypoints;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '姿态检测失败';
      console.error('[Hook:usePoseDetection] Detection error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDetecting(false);
      console.log('[Hook:usePoseDetection] Detection finished');
    }
  }, [initializeModel]);

  const detectPoseFromElement = useCallback(
    async (
      element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
      captureMode: CaptureMode = 'fullBody'
    ): Promise<PoseKeypoint17[]> => {
      setIsDetecting(true);
      setError(null);

      try {
        await initializeModel();

        const rawPose = await withTimeout(detectPose(element, false));
        const keypoints = normalizeMoveNetKeypoints(rawPose.keypoints);

        const validation = validateKeypointsForMode(keypoints, captureMode);
        if (!validation.isValid) {
          throw new Error(validation.message ?? '检测到的关键点不足，请确保身体在画面中清晰可见');
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
      console.log('[Hook:usePoseDetection] Changing model type from', currentModelType, 'to', type);
      setCurrentModelType(type);
      isInitialized.current = false;
      initPromise.current = null;
      disposeDetector();
      console.log('[Hook:usePoseDetection] Model type changed');
    }
  }, [currentModelType]);

  useEffect(() => {
    console.log('[Hook:usePoseDetection] useEffect mount: autoInit =', autoInit);
    
    if (autoInit) {
      initializeModel();
    }

    return () => {
      console.log('[Hook:usePoseDetection] Component cleanup triggered');
      disposeDetector();
      isInitialized.current = false;
      initPromise.current = null;
      console.log('[Hook:usePoseDetection] Cleanup complete');
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
