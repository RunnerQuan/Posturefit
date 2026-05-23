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
  if (isTensorFlowReady) {
    return;
  }
  try {
    await tf.setBackend('webgl');
    await tf.ready();
    isTensorFlowReady = true;
    console.log('TensorFlow.js ready with backend:', tf.getBackend());
  } catch (error) {
    console.warn('WebGL backend not available, falling back to WASM:', error);
    try {
      await tf.setBackend('wasm');
      await tf.ready();
      isTensorFlowReady = true;
      console.log('TensorFlow.js ready with WASM backend');
    } catch (wasmError) {
      console.error('WASM backend also failed:', wasmError);
      throw wasmError;
    }
  }
}

export async function createPoseDetector(config: PoseDetectorConfig = {}): Promise<poseDetection.PoseDetector> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (detector) {
    return detector;
  }

  await initializeTensorFlow();

  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig: poseDetection.MoveNetModelConfig = {
    modelType: finalConfig.modelType,
    enableSmoothing: finalConfig.enableSmoothing,
  };

  detector = await poseDetection.createDetector(model, detectorConfig);
  console.log('Pose detector initialized:', finalConfig.modelType);
  
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
  if (!detector) {
    detector = await createPoseDetector();
  }

  const poses = await detector.estimatePoses(imageSource, { flipHorizontal });
  
  if (poses.length === 0) {
    throw new Error('未检测到人体姿态，请确保图片中包含清晰的人体');
  }

  return poses[0] as RawPose;
}

export function disposeDetector(): void {
  if (detector) {
    detector.dispose();
    detector = null;
    console.log('Pose detector disposed');
  }
}

export function isDetectorReady(): boolean {
  return detector !== null;
}
