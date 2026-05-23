import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

export type MoveNetModelType = 'SinglePose.Lightning' | 'SinglePose.Thunder' | 'MultiPose.Lightning';

export interface PoseDetectorConfig {
  modelType?: MoveNetModelType;
  enableSmoothing?: boolean;
}

const DEFAULT_CONFIG: Required<PoseDetectorConfig> = {
  modelType: 'SinglePose.Lightning',
  enableSmoothing: true,
};

let detector: poseDetection.PoseDetector | null = null;
let isTensorFlowReady = false;

export async function initializeTensorFlow(): Promise<void> {
  console.log('[TensorFlow] Initializing... isTensorFlowReady:', isTensorFlowReady);
  if (isTensorFlowReady) {
    console.log('[TensorFlow] Already initialized, skipping');
    return;
  }
  try {
    console.log('[TensorFlow] Setting WebGL backend...');
    await tf.setBackend('webgl');
    await tf.ready();
    isTensorFlowReady = true;
    const backend = tf.getBackend();
    console.log('[TensorFlow] ✓ Ready with backend:', backend);
  } catch (error) {
    console.warn('[TensorFlow] WebGL backend not available, falling back to WASM:', error);
    try {
      console.log('[TensorFlow] Setting WASM backend...');
      await tf.setBackend('wasm');
      await tf.ready();
      isTensorFlowReady = true;
      console.log('[TensorFlow] ✓ Ready with WASM backend');
    } catch (wasmError) {
      console.error('[TensorFlow] WASM backend also failed:', wasmError);
      isTensorFlowReady = false;
      throw wasmError;
    }
  }
}

export async function createPoseDetector(config: PoseDetectorConfig = {}): Promise<poseDetection.PoseDetector> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  console.log('[PoseDetector] Creating detector with config:', finalConfig);
  
  if (detector) {
    console.log('[PoseDetector] Detector already exists, returning cached instance');
    return detector;
  }

  console.log('[PoseDetector] Initializing TensorFlow backend...');
  await initializeTensorFlow();

  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig: poseDetection.MoveNetModelConfig = {
    modelType: finalConfig.modelType,
    enableSmoothing: finalConfig.enableSmoothing,
  };

  try {
    console.log('[PoseDetector] Creating MoveNet detector...');
    detector = await poseDetection.createDetector(model, detectorConfig);
    console.log('[PoseDetector] ✓ Detector initialized:', finalConfig.modelType);
  } catch (error) {
    console.error('[PoseDetector] Failed to create detector:', error);
    detector = null;
    throw error;
  }
  
  return detector;
}

export interface RawKeypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface RawPose {
  keypoints: RawKeypoint[];
  score?: number;
}

export async function detectPose(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  flipHorizontal: boolean = false
): Promise<RawPose> {
  console.log('[detectPose] Starting pose detection...');
  console.log('[detectPose] Detector exists:', !!detector);
  
  if (!detector) {
    console.log('[detectPose] No detector, creating new one...');
    detector = await createPoseDetector();
  }

  try {
    console.log('[detectPose] Estimating poses...');
    const startTime = performance.now();
    const poses = await detector.estimatePoses(imageSource, { flipHorizontal });
    const endTime = performance.now();
    console.log('[detectPose] Estimation completed in', (endTime - startTime).toFixed(2), 'ms');
    
    if (poses.length === 0) {
      console.warn('[detectPose] No poses detected in image');
      throw new Error('未检测到人体姿态，请确保图片中包含清晰的人体');
    }

    console.log('[detectPose] ✓ Found', poses.length, 'pose(s), using first one');
    return poses[0] as RawPose;
  } catch (error) {
    console.error('[detectPose] Error during pose estimation:', error);
    throw error;
  }
}

export function disposeDetector(): void {
  console.log('[Cleanup] Disposing detector...');
  if (detector) {
    try {
      detector.dispose();
      console.log('[Cleanup] ✓ Detector disposed');
    } catch (error) {
      console.error('[Cleanup] Error disposing detector:', error);
    }
    detector = null;
  } else {
    console.log('[Cleanup] No detector to dispose');
  }
}

export function isDetectorReady(): boolean {
  const ready = detector !== null;
  console.log('[Status] Detector ready:', ready);
  return ready;
}
