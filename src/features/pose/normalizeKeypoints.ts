import type { PoseKeypoint17, KeypointName, CaptureMode } from '../../types';

const MOVENET_TO_NORMALIZED: Record<number, KeypointName> = {
  0: 'nose',
  1: 'leftEye',
  2: 'rightEye',
  3: 'leftEar',
  4: 'rightEar',
  5: 'leftShoulder',
  6: 'rightShoulder',
  7: 'leftElbow',
  8: 'rightElbow',
  9: 'leftWrist',
  10: 'rightWrist',
  11: 'leftHip',
  12: 'rightHip',
  13: 'leftKnee',
  14: 'rightKnee',
  15: 'leftAnkle',
  16: 'rightAnkle',
};

// 各拍摄模式需要的最少有效关键点数量
export const MODE_MIN_KEYPOINTS: Record<CaptureMode, number> = {
  fullBody: 10,    // 需要全身：鼻子、肩、髋、膝、踝
  halfBody: 5,     // 需要：鼻子、肩(2)、髋(2)
  closeUp: 3,      // 只需要：鼻子、肩(2)
  sitting: 7,      // 需要：鼻子、肩(2)、髋(2)、膝(2)
};

const KEYPOINT_NAME_TO_INDEX: Record<KeypointName, number> = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
};

interface RawKeypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export function normalizeMoveNetKeypoints(rawKeypoints: RawKeypoint[]): PoseKeypoint17[] {
  const normalized: PoseKeypoint17[] = [];
  
  for (let i = 0; i < rawKeypoints.length; i++) {
    const keypoint = rawKeypoints[i];
    const normalizedName = MOVENET_TO_NORMALIZED[i];
    
    if (normalizedName && keypoint && (keypoint.score ?? 0) > 0) {
      normalized.push({
        name: normalizedName,
        x: keypoint.x,
        y: keypoint.y,
        score: keypoint.score ?? 0,
      });
    }
  }

  for (let i = 0; i < 17; i++) {
    const expectedName = MOVENET_TO_NORMALIZED[i];
    if (!normalized.find(k => k.name === expectedName)) {
      normalized.push({
        name: expectedName,
        x: 0,
        y: 0,
        score: 0,
      });
    }
  }

  return normalized;
}

export function getKeypointByName(keypoints: PoseKeypoint17[], name: KeypointName): PoseKeypoint17 | undefined {
  return keypoints.find(k => k.name === name);
}

export function getKeypointIndex(name: KeypointName): number {
  return KEYPOINT_NAME_TO_INDEX[name];
}

export function scaleKeypoints(
  keypoints: PoseKeypoint17[],
  scaleX: number,
  scaleY: number
): PoseKeypoint17[] {
  return keypoints.map(k => ({
    ...k,
    x: k.x * scaleX,
    y: k.y * scaleY,
  }));
}

export function flipKeypointsHorizontal(keypoints: PoseKeypoint17[], imageWidth: number): PoseKeypoint17[] {
  return keypoints.map(k => ({
    ...k,
    x: imageWidth - k.x,
  }));
}

export function areKeypointsValid(
  keypoints: PoseKeypoint17[],
  minScore: number = 0.3,
  minKeypointCount: number = 10
): boolean {
  const validCount = keypoints.filter(k => k.score >= minScore).length;
  return validCount >= minKeypointCount;
}

export const SKELETON_CONNECTIONS: [KeypointName, KeypointName][] = [
  ['nose', 'leftEye'],
  ['nose', 'rightEye'],
  ['leftEye', 'leftEar'],
  ['rightEye', 'rightEar'],
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['rightShoulder', 'rightElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['rightHip', 'rightKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightKnee', 'rightAnkle'],
];

// Keypoint validation requirements by capture mode
const MODE_REQUIREMENTS: Record<CaptureMode, { required: KeypointName[]; optional: KeypointName[]; message: string }> = {
  fullBody: {
    required: ['nose', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
    optional: ['leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'],
    message: '请上传完整全身照片，确保头部、肩部、髋部、膝盖和脚踝都在画面内',
  },
  halfBody: {
    required: ['nose', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'],
    optional: ['leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
    message: '请上传包含肩部和髋部的照片',
  },
  closeUp: {
    required: ['nose', 'leftShoulder', 'rightShoulder'],
    optional: ['leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
    message: '请上传包含肩颈部位的照片',
  },
  sitting: {
    required: ['nose', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee'],
    optional: ['leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftAnkle', 'rightAnkle'],
    message: '请上传包含肩部、髋部和膝盖的照片',
  },
};

// 关键点中文标签映射
export const KEYPOINT_LABELS: Record<KeypointName, string> = {
  nose: '鼻子',
  leftEye: '左眼',
  rightEye: '右眼',
  leftEar: '左耳',
  rightEar: '右耳',
  leftShoulder: '左肩',
  rightShoulder: '右肩',
  leftElbow: '左肘',
  rightElbow: '右肘',
  leftWrist: '左手腕',
  rightWrist: '右手腕',
  leftHip: '左髋',
  rightHip: '右髋',
  leftKnee: '左膝',
  rightKnee: '右膝',
  leftAnkle: '左踝',
  rightAnkle: '右踝',
};

export interface ValidationResult {
  isValid: boolean;
  message: string;
  missingKeypoints?: KeypointName[];
}

export function validateKeypointsForMode(keypoints: PoseKeypoint17[], mode: CaptureMode): ValidationResult {
  console.log('[DEBUG validateKeypointsForMode] 开始验证, mode:', mode);
  console.log('[DEBUG validateKeypointsForMode] 传入的关键点数量:', keypoints.length);

  const requirements = MODE_REQUIREMENTS[mode];
  const validKeypoints = keypoints.filter(k => k.score >= 0.3);
  console.log('[DEBUG validateKeypointsForMode] 有效关键点数量(score>=0.3):', validKeypoints.length);
  console.log('[DEBUG validateKeypointsForMode] 有效关键点:', validKeypoints.map(k => `${k.name}:${k.score?.toFixed(2)}`).join(', '));
  console.log('[DEBUG validateKeypointsForMode] 要求的关键点:', requirements.required.join(', '));

  const missingKeypoints: KeypointName[] = [];

  for (const required of requirements.required) {
    const found = validKeypoints.find(k => k.name === required);
    if (!found) {
      console.log('[DEBUG validateKeypointsForMode] 缺失:', required);
      missingKeypoints.push(required);
    }
  }

  console.log('[DEBUG validateKeypointsForMode] 缺失的关键点列表:', missingKeypoints);

  if (missingKeypoints.length > 0) {
    return {
      isValid: false,
      message: requirements.message,
      missingKeypoints,
    };
  }

  return { isValid: true, message: '验证通过' };
}
