import type { CaptureMode, PoseKeypoint17, KeypointName } from '../../types';

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

export function areKeypointsValid(keypoints: PoseKeypoint17[], minScore: number = 0.3): boolean {
  const validCount = keypoints.filter(k => k.score >= minScore).length;
  return validCount >= 10;
}

export type KeypointValidationResult = {
  isValid: boolean;
  message?: string;
};

const MODE_VALIDATION_MESSAGES: Record<CaptureMode, string> = {
  fullBody: '请上传完整全身照片，确保头部、肩部、髋部、膝盖和脚踝都在画面内',
  halfBody: '请上传清晰半身照片，确保头部、肩部和上半身主体都在画面内',
  closeUp: '请上传清晰特写照片，确保头颈和双肩都在画面内',
  sitting: '请上传清晰坐姿照片，确保头部、肩部和上半身主体都在画面内',
};

const REQUIRED_KEYPOINT_GROUPS: Record<CaptureMode, KeypointName[][]> = {
  fullBody: [
    ['nose', 'leftEar', 'rightEar'],
    ['leftShoulder', 'rightShoulder'],
    ['leftHip', 'rightHip'],
    ['leftKnee', 'rightKnee'],
    ['leftAnkle', 'rightAnkle'],
  ],
  halfBody: [
    ['nose', 'leftEar', 'rightEar'],
    ['leftShoulder', 'rightShoulder'],
    ['leftHip', 'rightHip'],
  ],
  closeUp: [
    ['leftEar', 'rightEar'],
    ['leftShoulder', 'rightShoulder'],
  ],
  sitting: [
    ['nose', 'leftEar', 'rightEar'],
    ['leftShoulder', 'rightShoulder'],
    ['leftHip', 'rightHip'],
  ],
};

function hasVisibleKeypoint(keypoints: PoseKeypoint17[], names: KeypointName[], minScore: number): boolean {
  return names.some(name => {
    const keypoint = getKeypointByName(keypoints, name);
    return keypoint !== undefined && keypoint.score >= minScore;
  });
}

export function validateKeypointsForMode(
  keypoints: PoseKeypoint17[],
  captureMode: CaptureMode,
  minScore: number = 0.3
): KeypointValidationResult {
  const groups = REQUIRED_KEYPOINT_GROUPS[captureMode];
  const hasRequiredGroups = groups.every(group => hasVisibleKeypoint(keypoints, group, minScore));

  if (!hasRequiredGroups) {
    return {
      isValid: false,
      message: MODE_VALIDATION_MESSAGES[captureMode],
    };
  }

  return { isValid: true };
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
