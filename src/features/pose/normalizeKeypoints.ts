import type { PoseKeypoint33, BlazePoseLandmark, PoseKeypoint17, KeypointName, CaptureMode, PoseView } from '../../types';

export type PoseSide = 'left' | 'right';
export type SideOrientation = 'facingLeft' | 'facingRight' | 'unknown';
export type SideBodyPart = 'ear' | 'shoulder' | 'hip' | 'knee' | 'ankle' | 'heel' | 'footIndex';

export interface VisibleSideKeypoints {
  side: PoseSide;
  shoulder: PoseKeypoint33 | null;
  hip: PoseKeypoint33 | null;
  knee: PoseKeypoint33 | null;
  ankle: PoseKeypoint33 | null;
  ear: PoseKeypoint33 | null;
  heel: PoseKeypoint33 | null;
  footIndex: PoseKeypoint33 | null;
}

export interface PoseQualityResult {
  isReliable: boolean;
  message?: string;
}

// =============================================================================
// MediaPipe BlazePose 33 点索引映射
// 参考: docs/MediaPipe_BlazePose_体态识别替换技术文档.md
// =============================================================================

const BLAZEPOSE_INDEX_TO_LANDMARK: Record<number, BlazePoseLandmark> = {
  0: 'nose',
  1: 'left_eye_inner',
  2: 'left_eye',
  3: 'left_eye_outer',
  4: 'right_eye_inner',
  5: 'right_eye',
  6: 'right_eye_outer',
  7: 'left_ear',
  8: 'right_ear',
  9: 'mouth_left',
  10: 'mouth_right',
  11: 'left_shoulder',
  12: 'right_shoulder',
  13: 'left_elbow',
  14: 'right_elbow',
  15: 'left_wrist',
  16: 'right_wrist',
  17: 'left_pinky',
  18: 'right_pinky',
  19: 'left_index',
  20: 'right_index',
  21: 'left_thumb',
  22: 'right_thumb',
  23: 'left_hip',
  24: 'right_hip',
  25: 'left_knee',
  26: 'right_knee',
  27: 'left_ankle',
  28: 'right_ankle',
  29: 'left_heel',
  30: 'right_heel',
  31: 'left_foot_index',
  32: 'right_foot_index',
};

// 各拍摄模式需要的最少有效关键点数量
export const MODE_MIN_KEYPOINTS: Record<CaptureMode, number> = {
  fullBody: 12,    // 需要全身：鼻子、肩、髋、膝、踝、脚跟、脚尖
  halfBody: 5,     // 需要：鼻子、肩(2)、髋(2)
  closeUp: 5,      // 需要：鼻子、肩(2)、髋(2)
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

// =============================================================================
// BlazePose 33 点标准化
// =============================================================================

export function normalizeBlazePoseKeypoints(rawKeypoints: RawKeypoint[]): PoseKeypoint33[] {
  const normalized: PoseKeypoint33[] = [];

  for (let i = 0; i < Math.min(rawKeypoints.length, 33); i++) {
    const keypoint = rawKeypoints[i];
    const landmarkName = BLAZEPOSE_INDEX_TO_LANDMARK[i];

    if (landmarkName && keypoint) {
      normalized.push({
        name: landmarkName,
        x: keypoint.x,
        y: keypoint.y,
        z: keypoint.z,
        score: keypoint.score ?? 0,
      });
    }
  }

  // 补全所有 33 个关键点
  for (let i = 0; i < 33; i++) {
    const landmarkName = BLAZEPOSE_INDEX_TO_LANDMARK[i];
    if (!normalized.find(k => k.name === landmarkName)) {
      normalized.push({
        name: landmarkName,
        x: 0,
        y: 0,
        score: 0,
      });
    }
  }

  return normalized;
}

interface RawKeypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}

// 获取 BlazePose 关键点
export function getBlazePoseKeypoint(keypoints: PoseKeypoint33[], name: BlazePoseLandmark): PoseKeypoint33 | undefined {
  return keypoints.find(k => k.name === name);
}

function isVisible(keypoint: PoseKeypoint33 | null | undefined, minScore: number = 0.5): keypoint is PoseKeypoint33 {
  return Boolean(keypoint && keypoint.score >= minScore);
}

// 获取可见侧的关键点（用于侧面照）
export function getVisibleSideKeypoint(
  keypoints: PoseKeypoint33[],
  side: PoseSide
): VisibleSideKeypoints {
  const prefix = side === 'left' ? 'left' : 'right';
  return {
    side,
    shoulder: getBlazePoseKeypoint(keypoints, `${prefix}_shoulder` as BlazePoseLandmark) ?? null,
    hip: getBlazePoseKeypoint(keypoints, `${prefix}_hip` as BlazePoseLandmark) ?? null,
    knee: getBlazePoseKeypoint(keypoints, `${prefix}_knee` as BlazePoseLandmark) ?? null,
    ankle: getBlazePoseKeypoint(keypoints, `${prefix}_ankle` as BlazePoseLandmark) ?? null,
    ear: getBlazePoseKeypoint(keypoints, `${prefix}_ear` as BlazePoseLandmark) ?? null,
    heel: getBlazePoseKeypoint(keypoints, `${prefix}_heel` as BlazePoseLandmark) ?? null,
    footIndex: getBlazePoseKeypoint(keypoints, `${prefix}_foot_index` as BlazePoseLandmark) ?? null,
  };
}

function sidePartToKeypoint(sideKeypoints: VisibleSideKeypoints, part: SideBodyPart): PoseKeypoint33 | null {
  return sideKeypoints[part];
}

function scoreVisibleSide(sideKeypoints: VisibleSideKeypoints): number {
  const parts: SideBodyPart[] = ['ear', 'shoulder', 'hip', 'knee', 'ankle', 'heel', 'footIndex'];
  return parts.reduce((sum, part) => {
    const point = sidePartToKeypoint(sideKeypoints, part);
    return sum + (isVisible(point) ? point.score : 0);
  }, 0);
}

export function selectVisibleSide(
  keypoints: PoseKeypoint33[],
  requiredParts: SideBodyPart[] = ['shoulder', 'hip']
): VisibleSideKeypoints | null {
  const sides = [getVisibleSideKeypoint(keypoints, 'left'), getVisibleSideKeypoint(keypoints, 'right')];
  const candidates = sides.filter(side =>
    requiredParts.every(part => isVisible(sidePartToKeypoint(side, part)))
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((a, b) => scoreVisibleSide(b) - scoreVisibleSide(a))[0];
}

export function estimateSideOrientation(
  keypoints: PoseKeypoint33[],
  visibleSide: VisibleSideKeypoints
): SideOrientation {
  const nose = getBlazePoseKeypoint(keypoints, 'nose');
  const { ear, shoulder, hip, footIndex, heel } = visibleSide;

  if (isVisible(nose) && isVisible(ear) && Math.abs(nose.x - ear.x) > 4) {
    return nose.x < ear.x ? 'facingLeft' : 'facingRight';
  }

  if (isVisible(ear) && isVisible(shoulder) && Math.abs(ear.x - shoulder.x) > 4) {
    return ear.x < shoulder.x ? 'facingLeft' : 'facingRight';
  }

  if (isVisible(footIndex) && isVisible(heel) && Math.abs(footIndex.x - heel.x) > 4) {
    return footIndex.x < heel.x ? 'facingLeft' : 'facingRight';
  }

  if (isVisible(shoulder) && isVisible(hip) && Math.abs(shoulder.x - hip.x) > 4) {
    return shoulder.x < hip.x ? 'facingLeft' : 'facingRight';
  }

  return 'unknown';
}

// =============================================================================
// 兼容层：转换为 17 点格式
// =============================================================================

export function normalizeMoveNetKeypoints(rawKeypoints: RawKeypoint[]): PoseKeypoint17[] {
  const blazePoseKeypoints = normalizeBlazePoseKeypoints(rawKeypoints);
  const normalized: PoseKeypoint17[] = [];

  // 提取 17 点关键点
  const keypoint17Names: KeypointName[] = [
    'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
    'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
    'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
    'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'
  ];

  for (const name of keypoint17Names) {
    const idx = KEYPOINT_NAME_TO_INDEX[name];
    const blazePoseLandmark = BLAZEPOSE_INDEX_TO_LANDMARK[idx];
    const blazePoseKp = blazePoseKeypoints.find(k => k.name === blazePoseLandmark);

    normalized.push({
      name,
      x: blazePoseKp?.x ?? 0,
      y: blazePoseKp?.y ?? 0,
      score: blazePoseKp?.score ?? 0,
    });
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

// =============================================================================
// 骨骼连接定义（33 点版本）
// =============================================================================

export const SKELETON_CONNECTIONS_33: [BlazePoseLandmark, BlazePoseLandmark][] = [
  // 面部
  ['nose', 'left_eye_inner'],
  ['nose', 'right_eye_inner'],
  ['left_eye_inner', 'left_eye'],
  ['left_eye', 'left_eye_outer'],
  ['right_eye_inner', 'right_eye'],
  ['right_eye', 'right_eye_outer'],
  ['left_eye_inner', 'left_ear'],
  ['right_eye_inner', 'right_ear'],
  // 躯干
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  // 下肢
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle'],
  // 脚部
  ['left_ankle', 'left_heel'],
  ['left_ankle', 'left_foot_index'],
  ['right_ankle', 'right_heel'],
  ['right_ankle', 'right_foot_index'],
  ['left_heel', 'left_foot_index'],
  ['right_heel', 'right_foot_index'],
];

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

function getSideViewRequirements(mode: CaptureMode): { requiredParts: SideBodyPart[]; message: string } {
  const messages: Record<CaptureMode, string> = {
    closeUp: '请上传包含同侧耳朵和肩部的侧面照片',
    halfBody: '请上传包含同侧耳朵、肩部和髋部的侧面照片',
    sitting: '请上传包含同侧耳朵、肩部、髋部和膝盖的侧面照片',
    fullBody: '请上传包含同侧耳朵、肩部、髋部、膝盖和脚踝的侧面照片',
  };

  if (mode === 'closeUp') {
    return { requiredParts: ['ear', 'shoulder'], message: messages[mode] };
  }
  if (mode === 'sitting') {
    return { requiredParts: ['ear', 'shoulder', 'hip', 'knee'], message: messages[mode] };
  }
  if (mode === 'fullBody') {
    return { requiredParts: ['ear', 'shoulder', 'hip', 'knee', 'ankle'], message: messages[mode] };
  }
  return { requiredParts: ['ear', 'shoulder', 'hip'], message: messages[mode] };
}

function getSidePartLandmark(side: PoseSide, part: SideBodyPart): BlazePoseLandmark {
  const prefix = side;
  switch (part) {
    case 'ear':
      return `${prefix}_ear` as BlazePoseLandmark;
    case 'shoulder':
      return `${prefix}_shoulder` as BlazePoseLandmark;
    case 'hip':
      return `${prefix}_hip` as BlazePoseLandmark;
    case 'knee':
      return `${prefix}_knee` as BlazePoseLandmark;
    case 'ankle':
      return `${prefix}_ankle` as BlazePoseLandmark;
    case 'heel':
      return `${prefix}_heel` as BlazePoseLandmark;
    case 'footIndex':
      return `${prefix}_foot_index` as BlazePoseLandmark;
  }
}

function getMissingSideKeypoints(
  keypoints: PoseKeypoint33[],
  visibleSide: PoseSide,
  requiredParts: SideBodyPart[]
): BlazePoseLandmark[] {
  return requiredParts
    .map(part => getSidePartLandmark(visibleSide, part))
    .filter(landmark => !isVisible(getBlazePoseKeypoint(keypoints, landmark)));
}

const MODE_REQUIREMENTS: Record<CaptureMode, { required: BlazePoseLandmark[]; optional: BlazePoseLandmark[]; message: string }> = {
  fullBody: {
    required: ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    optional: ['left_ear', 'right_ear', 'left_elbow', 'right_elbow', 'left_heel', 'right_heel', 'left_foot_index', 'right_foot_index'],
    message: '请上传完整全身照片，确保头部、肩部、髋部、膝盖和脚踝都在画面内',
  },
  halfBody: {
    required: ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
    optional: ['left_ear', 'right_ear', 'left_elbow', 'right_elbow', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    message: '请上传包含肩部和髋部的照片',
  },
  closeUp: {
    required: ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
    optional: ['left_ear', 'right_ear', 'left_elbow', 'right_elbow'],
    message: '请上传包含头部、双肩和双髋的照片，确保头部偏移和高低肩都能识别',
  },
  sitting: {
    required: ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
    optional: ['left_ear', 'right_ear', 'left_elbow', 'right_elbow', 'left_ankle', 'right_ankle'],
    message: '请上传包含肩部、髋部和膝盖的照片',
  },
};

// 关键点中文标签映射（33 点版本）
export const KEYPOINT_LABELS_33: Record<BlazePoseLandmark, string> = {
  nose: '鼻子',
  left_eye_inner: '左眼内',
  left_eye: '左眼',
  left_eye_outer: '左眼外',
  right_eye_inner: '右眼内',
  right_eye: '右眼',
  right_eye_outer: '右眼外',
  left_ear: '左耳',
  right_ear: '右耳',
  mouth_left: '左嘴角',
  mouth_right: '右嘴角',
  left_shoulder: '左肩',
  right_shoulder: '右肩',
  left_elbow: '左肘',
  right_elbow: '右肘',
  left_wrist: '左手腕',
  right_wrist: '右手腕',
  left_pinky: '左手小指',
  right_pinky: '右手小指',
  left_index: '左手食指',
  right_index: '右手食指',
  left_thumb: '左手拇指',
  right_thumb: '右手拇指',
  left_hip: '左髋',
  right_hip: '右髋',
  left_knee: '左膝',
  right_knee: '右膝',
  left_ankle: '左踝',
  right_ankle: '右踝',
  left_heel: '左脚跟',
  right_heel: '右脚跟',
  left_foot_index: '左脚尖',
  right_foot_index: '右脚尖',
};

// 兼容层
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
  missingKeypoints?: BlazePoseLandmark[];
  qualityWarnings?: string[];
  visibleSide?: PoseSide;
}

export function validatePoseQuality(
  keypoints: PoseKeypoint33[],
  mode: CaptureMode,
  view?: PoseView
): PoseQualityResult {
  if (view !== 'front' || mode !== 'fullBody') {
    return { isReliable: true };
  }

  const leftShoulder = getBlazePoseKeypoint(keypoints, 'left_shoulder');
  const rightShoulder = getBlazePoseKeypoint(keypoints, 'right_shoulder');
  const leftHip = getBlazePoseKeypoint(keypoints, 'left_hip');
  const rightHip = getBlazePoseKeypoint(keypoints, 'right_hip');
  const leftAnkle = getBlazePoseKeypoint(keypoints, 'left_ankle');
  const rightAnkle = getBlazePoseKeypoint(keypoints, 'right_ankle');

  if (![leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle].every(point => isVisible(point))) {
    return { isReliable: true };
  }

  const shoulderWidth = Math.abs(rightShoulder!.x - leftShoulder!.x);
  const hipWidth = Math.abs(rightHip!.x - leftHip!.x);
  const ankleWidth = Math.abs(rightAnkle!.x - leftAnkle!.x);
  const maxCoordinate = Math.max(...keypoints.map(point => Math.max(Math.abs(point.x), Math.abs(point.y))));
  const minBodyWidth = maxCoordinate <= 2 ? 0.03 : 8;

  if (shoulderWidth < minBodyWidth || hipWidth < minBodyWidth || ankleWidth < minBodyWidth) {
    return {
      isReliable: false,
      message: '拍摄角度可能过于侧身或身体关键部位重叠，请正对镜头重拍',
    };
  }

  const shoulderHipRatio = shoulderWidth / hipWidth;
  if (shoulderHipRatio > 2.5 || shoulderHipRatio < 0.4) {
    return {
      isReliable: false,
      message: '拍摄角度或身体旋转可能影响识别，请正对镜头并保持身体自然站直',
    };
  }

  return { isReliable: true };
}

export function validateKeypointsForMode(
  keypoints: PoseKeypoint33[],
  mode: CaptureMode,
  view?: PoseView
): ValidationResult {
  const validKeypoints = keypoints.filter(k => k.score >= 0.5);

  if (view === 'side') {
    const sideRequirements = getSideViewRequirements(mode);
    const anchorSide = selectVisibleSide(keypoints, mode === 'closeUp' ? ['shoulder'] : ['shoulder', 'hip']);

    if (!anchorSide) {
      return {
        isValid: false,
        message: sideRequirements.message,
      };
    }

    const missingKeypoints = getMissingSideKeypoints(keypoints, anchorSide.side, sideRequirements.requiredParts);
    if (missingKeypoints.length > 0) {
      return {
        isValid: false,
        message: sideRequirements.message,
        missingKeypoints,
        visibleSide: anchorSide.side,
      };
    }

    const visibleSide = selectVisibleSide(keypoints, sideRequirements.requiredParts);
    if (!visibleSide) {
      return {
        isValid: false,
        message: sideRequirements.message,
      };
    }

    return { isValid: true, message: '验证通过', visibleSide: visibleSide.side };
  }

  const requirements = MODE_REQUIREMENTS[mode];

  const missingKeypoints: BlazePoseLandmark[] = [];

  for (const required of requirements.required) {
    const found = validKeypoints.find(k => k.name === required);
    if (!found) {
      missingKeypoints.push(required);
    }
  }

  if (missingKeypoints.length > 0) {
    return {
      isValid: false,
      message: requirements.message,
      missingKeypoints,
    };
  }

  const quality = validatePoseQuality(keypoints, mode, view);
  if (!quality.isReliable) {
    return {
      isValid: false,
      message: quality.message ?? '拍摄角度可能影响识别，请调整姿势后重拍',
      qualityWarnings: quality.message ? [quality.message] : undefined,
    };
  }

  return { isValid: true, message: '验证通过' };
}

// 兼容层：接受 17 点数组
export function validateKeypointsForModeLegacy(keypoints: PoseKeypoint17[], mode: CaptureMode): ValidationResult {
  // 转换为 33 点格式再验证
  const blazePoseKeypoints: PoseKeypoint33[] = keypoints.map(k => ({
    name: `${k.name.replace(/([A-Z])/g, '_$1').toLowerCase()}` as BlazePoseLandmark,
    x: k.x,
    y: k.y,
    score: k.score,
  }));
  return validateKeypointsForMode(blazePoseKeypoints, mode);
}
