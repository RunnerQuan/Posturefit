import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

export type BlazePoseModelType = 'BlazePose' | 'BlazePose_Lite' | 'BlazePose_Full' | 'BlazePose_Heavy';

export interface PoseDetectorConfig {
  modelType?: BlazePoseModelType;
  enableSmoothing?: boolean;
  runtime?: 'tfjs' | 'mediapipe';
}

const DEFAULT_CONFIG: Required<PoseDetectorConfig> = {
  modelType: 'BlazePose',
  enableSmoothing: true,
  runtime: 'tfjs',
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

  // 使用 MediaPipe BlazePose 33点模型
  const model = poseDetection.SupportedModels.BlazePose;
  const detectorConfig: poseDetection.BlazePoseTfjsModelConfig = {
    modelType: 'full', // 使用完整模型以获得最高精度
    enableSmoothing: finalConfig.enableSmoothing,
    runtime: 'tfjs',
  };

  detector = await poseDetection.createDetector(model, detectorConfig);
  console.log('BlazePose detector initialized');

  return detector;
}

export interface RawKeypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}

export interface RawPose {
  keypoints: RawKeypoint[];
  score?: number;
  worldKeypoints?: RawKeypoint[];
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
