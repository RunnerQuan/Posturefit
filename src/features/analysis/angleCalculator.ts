import type { PoseKeypoint33, BlazePoseLandmark, PostureAngleMetrics } from '../../types';
import {
  estimateSideOrientation,
  getBlazePoseKeypoint,
  selectVisibleSide,
  type SideOrientation,
} from '../pose/normalizeKeypoints';
import { calculateAngle, midpoint, distance, signedDistanceToLine, angleToHorizontal, type Point } from '../../lib/math';

// =============================================================================
// MediaPipe BlazePose 33 点角度计算
// 参考: docs/MediaPipe_BlazePose_体态识别替换技术文档.md
// =============================================================================

/**
 * 获取 BlazePose 关键点
 */
function getPoint(keypoints: PoseKeypoint33[], name: BlazePoseLandmark): Point | null {
  const kp = getBlazePoseKeypoint(keypoints, name);
  if (!kp || kp.score < 0.5) {
    return null;
  }
  return { x: kp.x, y: kp.y };
}

/**
 * 获取双侧关键点（优先使用左侧，备选右侧）
 */
function getBilateralPoints(
  keypoints: PoseKeypoint33[],
  side: 'left' | 'right'
): { shoulder: Point | null; hip: Point | null; knee: Point | null; ankle: Point | null } {
  const prefix = side === 'left' ? 'left' : 'right';
  return {
    shoulder: getPoint(keypoints, `${prefix}_shoulder` as BlazePoseLandmark),
    hip: getPoint(keypoints, `${prefix}_hip` as BlazePoseLandmark),
    knee: getPoint(keypoints, `${prefix}_knee` as BlazePoseLandmark),
    ankle: getPoint(keypoints, `${prefix}_ankle` as BlazePoseLandmark),
  };
}

/**
 * 计算肩宽（用于归一化）
 */
function getShoulderWidth(keypoints: PoseKeypoint33[]): number {
  const left = getPoint(keypoints, 'left_shoulder');
  const right = getPoint(keypoints, 'right_shoulder');
  if (left && right) {
    return distance(left, right);
  }
  return 1; // 避免除零
}

function toPoint(keypoint: PoseKeypoint33 | null): Point | null {
  if (!keypoint || keypoint.score < 0.5) {
    return null;
  }
  return { x: keypoint.x, y: keypoint.y };
}

function getDirectionMultiplier(orientation: SideOrientation): number | null {
  if (orientation === 'facingRight') return 1;
  if (orientation === 'facingLeft') return -1;
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distanceToSegmentLine(point: Point, lineStart: Point, lineEnd: Point): number {
  return Math.abs(signedDistanceToLine(point, lineStart, lineEnd));
}

export function getHeadCenterPoint(keypoints: PoseKeypoint33[]): Point | null {
  const weighted: Array<{ point: Point; weight: number }> = [];
  const pairs: [BlazePoseLandmark, BlazePoseLandmark, number][] = [
    ['left_ear', 'right_ear', 3],
    ['left_eye', 'right_eye', 2],
    ['left_eye_inner', 'right_eye_inner', 1.5],
    ['left_eye_outer', 'right_eye_outer', 1.5],
    ['mouth_left', 'mouth_right', 1],
  ];

  for (const [leftName, rightName, weight] of pairs) {
    const left = getPoint(keypoints, leftName);
    const right = getPoint(keypoints, rightName);
    if (left && right) {
      weighted.push({ point: midpoint(left, right), weight });
    }
  }

  const nose = getPoint(keypoints, 'nose');
  if (nose) {
    weighted.push({ point: nose, weight: 2 });
  }

  if (weighted.length === 0) {
    return null;
  }

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  return {
    x: weighted.reduce((sum, item) => sum + item.point.x * item.weight, 0) / totalWeight,
    y: weighted.reduce((sum, item) => sum + item.point.y * item.weight, 0) / totalWeight,
  };
}

// ============================================================================
// 正面视角指标计算
// ============================================================================

/**
 * 高低肩角度：双肩连线与水平线夹角
 * 技术文档 6.4 节
 * 返回偏离水平姿态的角度（0° = 完全水平，越大越不平衡）
 */
export function calculateShoulderImbalanceAngle(keypoints: PoseKeypoint33[]): number | null {
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');

  if (!leftShoulder || !rightShoulder) {
    return null;
  }

  const angle = angleToHorizontal(leftShoulder, rightShoulder);
  // atan2 返回 -180° 到 180°
  // 转换为与水平线的最小偏离角度
  // 例如：3° 和 177° 都表示接近水平
  return Math.min(Math.abs(angle), 180 - Math.abs(angle));
}

/**
 * 骨盆侧倾角度：双髋连线与水平线夹角
 * 技术文档 6.5 节
 * 返回偏离水平姿态的角度（0° = 完全水平）
 */
export function calculatePelvicTiltAngle(keypoints: PoseKeypoint33[]): number | null {
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');

  if (!leftHip || !rightHip) {
    return null;
  }

  const angle = angleToHorizontal(leftHip, rightHip);
  // 转换为与水平线的最小偏离角度
  return Math.min(Math.abs(angle), 180 - Math.abs(angle));
}

/**
 * 骨盆前倾角度：侧面视角
 * 计算肩部中点、髋部中点和膝部中点的角度
 * 正值表示骨盆前倾，负值表示骨盆后倾
 */
export function calculateAnteriorPelvicTiltAngle(keypoints: PoseKeypoint33[]): number | null {
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');
  const leftKnee = getPoint(keypoints, 'left_knee');
  const rightKnee = getPoint(keypoints, 'right_knee');

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee) {
    return null;
  }

  // 计算中点
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const kneeMid = midpoint(leftKnee, rightKnee);

  // 计算躯干与大腿的夹角
  const angle = calculateAngle(shoulderMid, hipMid, kneeMid);

  // 正常站立时，躯干与大腿接近一条直线（约180度）
  // 骨盆前倾时，这个角度会变小
  // 返回偏离180度的角度，正值表示前倾
  return 180 - angle;
}

/**
 * 膝内扣角度：FPPA (Frontal Plane Projection Angle) + 偏移距离
 * 技术文档 6.6 节
 * 返回归一化后的分数 (0-1)，0 表示正常，1 表示严重
 */
export function calculateKneeValgusAngle(keypoints: PoseKeypoint33[]): number | null {
  // 计算左右两侧
  const leftPoints = getBilateralPoints(keypoints, 'left');
  const rightPoints = getBilateralPoints(keypoints, 'right');

  let totalScore = 0;
  let count = 0;

  // 左侧 FPPA
  if (leftPoints.hip && leftPoints.knee && leftPoints.ankle) {
    const fppa = calculateAngle(leftPoints.hip, leftPoints.knee, leftPoints.ankle);
    // 归一化：正常约 180°，内扣时角度减小
    const deviation = Math.max(0, 180 - fppa);
    const offset = distanceToSegmentLine(leftPoints.knee, leftPoints.hip, leftPoints.ankle);
    const legLength = distance(leftPoints.hip, leftPoints.ankle) || 1;
    totalScore += deviation + (offset / legLength) * 45;
    count++;
  }

  // 右侧 FPPA
  if (rightPoints.hip && rightPoints.knee && rightPoints.ankle) {
    const fppa = calculateAngle(rightPoints.hip, rightPoints.knee, rightPoints.ankle);
    const deviation = Math.max(0, 180 - fppa);
    const offset = distanceToSegmentLine(rightPoints.knee, rightPoints.hip, rightPoints.ankle);
    const legLength = distance(rightPoints.hip, rightPoints.ankle) || 1;
    totalScore += deviation + (offset / legLength) * 45;
    count++;
  }

  if (count === 0) {
    return null;
  }

  // 转换为角度值（取平均偏差角度）
  return totalScore / count;
}

/**
 * 头部偏移角度：头部中线与躯干中线夹角
 * 技术文档 6.7 节
 */
export function calculateHeadOffsetAngle(keypoints: PoseKeypoint33[]): number | null {
  const headCenter = getHeadCenterPoint(keypoints);
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');

  if (!headCenter || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null;
  }

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);

  // 计算头部中心到躯干中线的距离
  const offset = signedDistanceToLine(headCenter, shoulderMid, hipMid);
  const shoulderWidth = getShoulderWidth(keypoints);

  // 归一化偏移量，转换为角度
  const normalizedOffset = Math.abs(offset) / shoulderWidth;
  return normalizedOffset * 45; // 乘以系数转换为角度范围
}

/**
 * 身体重心偏移角度：身体中轴相对足部支撑中心的偏移
 * 技术文档 6.8 节
 */
export function calculateCenterOfGravityShiftAngle(keypoints: PoseKeypoint33[]): number | null {
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');
  const leftAnkle = getPoint(keypoints, 'left_ankle');
  const rightAnkle = getPoint(keypoints, 'right_ankle');

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) {
    return null;
  }

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const bodyCenter = midpoint(shoulderMid, hipMid);
  const ankleMid = midpoint(leftAnkle, rightAnkle);

  const shoulderWidth = getShoulderWidth(keypoints);
  const offset = Math.abs(bodyCenter.x - ankleMid.x);
  const normalizedOffset = offset / shoulderWidth;

  return normalizedOffset * 45; // 转换为角度范围
}

// ============================================================================
// 侧面视角指标计算
// ============================================================================

/**
 * 头前伸角度：CVA（Craniovertebral Angle，耳-肩连线与水平线夹角）
 * 技术文档 6.1 节
 * 返回偏离正常姿态(50°)的角度，偏离越大表示头前伸越严重
 * 关键点不可见时返回 null
 */
export function calculateForwardHeadAngle(keypoints: PoseKeypoint33[]): number | null {
  const visibleSide = selectVisibleSide(keypoints, ['ear', 'shoulder']);
  if (!visibleSide) {
    return null;
  }

  const shoulder = toPoint(visibleSide.shoulder);
  const ear = toPoint(visibleSide.ear);
  if (!shoulder || !ear) {
    return null;
  }

  const rawCva = Math.atan2(Math.abs(shoulder.y - ear.y), Math.abs(ear.x - shoulder.x)) * (180 / Math.PI);
  const hip = toPoint(visibleSide.hip);
  const bodyHeight = hip
    ? Math.abs(shoulder.y - hip.y)
    : Math.abs(shoulder.y - ear.y);
  if (bodyHeight <= 0) {
    return rawCva;
  }

  const direction = getDirectionMultiplier(estimateSideOrientation(keypoints, visibleSide));
  const forwardOffset = direction === null
    ? Math.abs(ear.x - shoulder.x)
    : Math.max(0, (ear.x - shoulder.x) * direction);
  const headForwardRatio = forwardOffset / bodyHeight;
  const ratioCva = clamp(55 - headForwardRatio * 80, 20, 90);

  return Math.min(rawCva, ratioCva);
}

/**
 * 圆肩角度：肩点相对髋点前移 + 躯干前倾
 * 技术文档 6.2 节
 * 返回综合分数 (0-1)
 * 关键点不可见时返回 null
 */
export function calculateRoundedShoulderAngle(keypoints: PoseKeypoint33[]): number | null {
  const visibleSide = selectVisibleSide(keypoints, ['shoulder', 'hip']);
  if (!visibleSide) {
    return null;
  }

  return calculateRoundShoulderFromPoints(
    toPoint(visibleSide.shoulder)!,
    toPoint(visibleSide.hip)!,
    toPoint(visibleSide.ear),
    estimateSideOrientation(keypoints, visibleSide)
  );
}

function calculateRoundShoulderFromPoints(
  shoulder: Point,
  hip: Point,
  ear: Point | null,
  orientation: SideOrientation
): number {
  // 计算肩-髋连线与垂直线的夹角（躯干前倾角）
  // 直立时约 0°，前倾时角度增大
  const rawAngle = angleToHorizontal(hip, shoulder);
  // atan2 返回 -180° 到 180°，转换为与垂直线（90°）的最小偏离
  const normalized = Math.min(Math.abs(rawAngle), 180 - Math.abs(rawAngle));
  const trunkLean = Math.abs(90 - normalized);

  // 计算头部前移（如果有耳朵数据）
  let headForward = 0;
  if (ear) {
    const direction = getDirectionMultiplier(orientation);
    headForward = direction === null
      ? Math.abs(ear.x - shoulder.x)
      : Math.max(0, (ear.x - shoulder.x) * direction);
  }

  // 综合评分
  // 修复：用肩-髋垂直距离归一化（典型值约 0.15-0.25，不会接近零）
  const bodyHeight = Math.abs(shoulder.y - hip.y) || 1;
  const normalizedHead = headForward / bodyHeight;
  const normalizedTrunk = trunkLean / 45;

  return (0.5 * normalizedHead + 0.5 * normalizedTrunk) * 30; // 转换为角度范围
}

/**
 * 驼背倾向角度：加权综合 FHP + shoulder + trunk_lean
 * 技术文档 6.9 节
 * kyphosis_score = 0.4*FHP_norm + 0.3*shoulder_norm + 0.3*trunk_lean_norm
 */
export function calculateHunchbackAngle(keypoints: PoseKeypoint33[]): number | null {
  const visibleSide = selectVisibleSide(keypoints, ['shoulder', 'hip']);
  if (!visibleSide) {
    return null;
  }

  return calculateHunchbackFromPoints(
    toPoint(visibleSide.shoulder)!,
    toPoint(visibleSide.hip)!,
    toPoint(visibleSide.ear),
    estimateSideOrientation(keypoints, visibleSide)
  );
}

function calculateHunchbackFromPoints(
  shoulder: Point,
  hip: Point,
  ear: Point | null,
  orientation: SideOrientation
): number {
  // 躯干前倾角
  const rawAngle = angleToHorizontal(hip, shoulder);
  const normalized = Math.min(Math.abs(rawAngle), 180 - Math.abs(rawAngle));
  const trunkLean = Math.abs(90 - normalized);

  // 修复：用肩-髋垂直距离归一化（典型值约 0.15-0.25，不会接近零）
  const bodyHeight = Math.abs(shoulder.y - hip.y) || 1;
  const direction = getDirectionMultiplier(orientation);
  const shoulderForward = direction === null
    ? Math.abs(shoulder.x - hip.x)
    : Math.max(0, (shoulder.x - hip.x) * direction);

  // 头部前移
  let headForward = 0;
  if (ear) {
    headForward = direction === null
      ? Math.abs(ear.x - shoulder.x)
      : Math.max(0, (ear.x - shoulder.x) * direction);
  }

  // 归一化并加权
  const fhp_norm = headForward / bodyHeight;
  const shoulder_norm = shoulderForward / bodyHeight;
  const trunk_norm = trunkLean / 45;

  const score = 0.4 * fhp_norm + 0.3 * shoulder_norm + 0.3 * trunk_norm;

  return score * 20; // 转换为角度范围
}

/**
 * 膝超伸角度：侧面膝关节角
 * 技术文档 6.10 节
 */
export function calculateKneeHyperextensionAngle(keypoints: PoseKeypoint33[]): number | null {
  const visibleSide = selectVisibleSide(keypoints, ['hip', 'knee', 'ankle']);
  if (!visibleSide) {
    return null;
  }

  const hip = toPoint(visibleSide.hip);
  const knee = toPoint(visibleSide.knee);
  const ankle = toPoint(visibleSide.ankle);
  if (!hip || !knee || !ankle) {
    return null;
  }

  const baseAngle = calculateAngle(hip, knee, ankle);
  const orientation = estimateSideOrientation(keypoints, visibleSide);
  const direction = getDirectionMultiplier(orientation);
  if (direction === null) {
    return baseAngle;
  }

  const legLength = distance(hip, ankle) || 1;
  const posteriorOffset = -signedDistanceToLine(knee, hip, ankle) * direction;
  const hyperextension = Math.max(0, posteriorOffset / legLength) * 45;

  return hyperextension > 0 ? 180 + hyperextension : baseAngle;
}

/**
 * 计算躯干前倾角度（辅助指标）
 * 肩-髋连线与垂直线的夹角
 */
export function calculateTrunkLeanAngle(keypoints: PoseKeypoint33[]): number | null {
  const visibleSide = selectVisibleSide(keypoints, ['shoulder', 'hip']);
  if (!visibleSide) {
    return null;
  }
  const shoulder = toPoint(visibleSide.shoulder);
  const hip = toPoint(visibleSide.hip);

  const normalizeTrunkAngle = (rawAngle: number): number => {
    // atan2 返回 -180° 到 180°，转换为与垂直线（90°）的最小偏离
    const normalized = Math.min(Math.abs(rawAngle), 180 - Math.abs(rawAngle));
    return Math.abs(90 - normalized);
  };

  if (!shoulder || !hip) {
    return null;
  }

  return normalizeTrunkAngle(angleToHorizontal(hip, shoulder));
}

// ============================================================================
// 综合计算
// ============================================================================

export function calculateAllPostureAngles(keypoints: PoseKeypoint33[]): PostureAngleMetrics {
  return {
    // 正面视角
    forwardHeadAngle: calculateForwardHeadAngle(keypoints),
    shoulderImbalanceAngle: calculateShoulderImbalanceAngle(keypoints),
    pelvicTiltAngle: calculatePelvicTiltAngle(keypoints),
    kneeValgusAngle: calculateKneeValgusAngle(keypoints),
    headOffsetAngle: calculateHeadOffsetAngle(keypoints),
    centerOfGravityShiftAngle: calculateCenterOfGravityShiftAngle(keypoints),
    // 侧面视角
    roundedShoulderAngle: calculateRoundedShoulderAngle(keypoints),
    hunchbackAngle: calculateHunchbackAngle(keypoints),
    kneeHyperextensionAngle: calculateKneeHyperextensionAngle(keypoints),
    anteriorTiltAngle: calculateAnteriorPelvicTiltAngle(keypoints),
    // 辅助指标
    trunkLeanAngle: calculateTrunkLeanAngle(keypoints),
  };
}

// 导出单个视角的指标计算（用于选择性分析）
export function calculateFrontViewMetrics(keypoints: PoseKeypoint33[]): Partial<PostureAngleMetrics> {
  return {
    forwardHeadAngle: calculateForwardHeadAngle(keypoints),
    shoulderImbalanceAngle: calculateShoulderImbalanceAngle(keypoints),
    pelvicTiltAngle: calculatePelvicTiltAngle(keypoints),
    kneeValgusAngle: calculateKneeValgusAngle(keypoints),
    headOffsetAngle: calculateHeadOffsetAngle(keypoints),
    centerOfGravityShiftAngle: calculateCenterOfGravityShiftAngle(keypoints),
  };
}

export function calculateSideViewMetrics(keypoints: PoseKeypoint33[]): Partial<PostureAngleMetrics> {
  return {
    roundedShoulderAngle: calculateRoundedShoulderAngle(keypoints),
    hunchbackAngle: calculateHunchbackAngle(keypoints),
    kneeHyperextensionAngle: calculateKneeHyperextensionAngle(keypoints),
    anteriorTiltAngle: calculateAnteriorPelvicTiltAngle(keypoints),
    trunkLeanAngle: calculateTrunkLeanAngle(keypoints),
  };
}
