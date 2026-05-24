import type { PoseKeypoint33, BlazePoseLandmark, PostureAngleMetrics } from '../../types';
import { getBlazePoseKeypoint, getVisibleSideKeypoint } from '../pose/normalizeKeypoints';
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

// ============================================================================
// 正面视角指标计算
// ============================================================================

/**
 * 高低肩角度：双肩连线与水平线夹角
 * 技术文档 6.4 节
 * 返回偏离水平姿态的角度（0° = 完全水平，越大越不平衡）
 */
export function calculateShoulderImbalanceAngle(keypoints: PoseKeypoint33[]): number {
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');

  if (!leftShoulder || !rightShoulder) {
    return 0;
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
export function calculatePelvicTiltAngle(keypoints: PoseKeypoint33[]): number {
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');

  if (!leftHip || !rightHip) {
    return 0;
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
export function calculateAnteriorPelvicTiltAngle(keypoints: PoseKeypoint33[]): number {
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');
  const leftKnee = getPoint(keypoints, 'left_knee');
  const rightKnee = getPoint(keypoints, 'right_knee');

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee) {
    return 0;
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
export function calculateKneeValgusAngle(keypoints: PoseKeypoint33[]): number {
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
    totalScore += deviation;
    count++;
  }

  // 右侧 FPPA
  if (rightPoints.hip && rightPoints.knee && rightPoints.ankle) {
    const fppa = calculateAngle(rightPoints.hip, rightPoints.knee, rightPoints.ankle);
    const deviation = Math.max(0, 180 - fppa);
    totalScore += deviation;
    count++;
  }

  if (count === 0) {
    return 0;
  }

  // 转换为角度值（取平均偏差角度）
  return totalScore / count;
}

/**
 * 头部偏移角度：头部中线与躯干中线夹角
 * 技术文档 6.7 节
 */
export function calculateHeadOffsetAngle(keypoints: PoseKeypoint33[]): number {
  const nose = getPoint(keypoints, 'nose');
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');

  if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return 0;
  }

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);

  // 计算鼻子到躯干中线的距离
  const offset = signedDistanceToLine(nose, shoulderMid, hipMid);
  const shoulderWidth = getShoulderWidth(keypoints);

  // 归一化偏移量，转换为角度
  const normalizedOffset = Math.abs(offset) / shoulderWidth;
  return normalizedOffset * 45; // 乘以系数转换为角度范围
}

/**
 * 身体重心偏移角度：身体中轴相对足部支撑中心的偏移
 * 技术文档 6.8 节
 */
export function calculateCenterOfGravityShiftAngle(keypoints: PoseKeypoint33[]): number {
  const leftShoulder = getPoint(keypoints, 'left_shoulder');
  const rightShoulder = getPoint(keypoints, 'right_shoulder');
  const leftHip = getPoint(keypoints, 'left_hip');
  const rightHip = getPoint(keypoints, 'right_hip');
  const leftAnkle = getPoint(keypoints, 'left_ankle');
  const rightAnkle = getPoint(keypoints, 'right_ankle');

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) {
    return 0;
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
  const visibleSide = getVisibleSideKeypoint(keypoints, 'left');
  const NORMAL_CVA = 50; // 正常头颈椎角约 48-50°

  const trySide = (side: { shoulder: Point | null; ear: Point | null }): number | null => {
    if (!side.shoulder || !side.ear) return null;
    const rawAngle = angleToHorizontal(side.shoulder, side.ear);
    // atan2 gives 0° for vertical (ear directly above shoulder), 90° for horizontal
    // CVA = 90 - |rawAngle| (so vertical = 90°, horizontal = 0°)
    const absAngle = Math.min(Math.abs(rawAngle), 90);
    const cva = 90 - absAngle;
    // Positive deviation = forward head (CVA smaller than normal)
    return Math.max(0, NORMAL_CVA - cva);
  };

  let result = trySide(visibleSide);
  if (result === null) {
    const rightSide = getVisibleSideKeypoint(keypoints, 'right');
    result = trySide(rightSide);
  }
  return result;
}

/**
 * 圆肩角度：肩点相对髋点前移 + 躯干前倾
 * 技术文档 6.2 节
 * 返回综合分数 (0-1)
 * 关键点不可见时返回 null
 */
export function calculateRoundedShoulderAngle(keypoints: PoseKeypoint33[]): number | null {
  const visibleSide = getVisibleSideKeypoint(keypoints, 'left');
  const { shoulder, hip, ear } = visibleSide;

  if (!shoulder || !hip) {
    const rightSide = getVisibleSideKeypoint(keypoints, 'right');
    if (!rightSide.shoulder || !rightSide.hip) {
      return null;
    }
    return calculateRoundShoulderFromPoints(rightSide.shoulder, rightSide.hip, rightSide.ear);
  }

  return calculateRoundShoulderFromPoints(shoulder, hip, ear);
}

function calculateRoundShoulderFromPoints(
  shoulder: Point,
  hip: Point,
  ear: Point | null
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
    headForward = Math.abs(ear.x - shoulder.x);
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
export function calculateHunchbackAngle(keypoints: PoseKeypoint33[]): number {
  const visibleSide = getVisibleSideKeypoint(keypoints, 'left');
  const { shoulder, hip, ear } = visibleSide;

  if (!shoulder || !hip) {
    const rightSide = getVisibleSideKeypoint(keypoints, 'right');
    if (!rightSide.shoulder || !rightSide.hip) {
      return 0;
    }
    return calculateHunchbackFromPoints(rightSide.shoulder, rightSide.hip, rightSide.ear);
  }

  return calculateHunchbackFromPoints(shoulder, hip, ear);
}

function calculateHunchbackFromPoints(
  shoulder: Point,
  hip: Point,
  ear: Point | null
): number {
  // 躯干前倾角
  const rawAngle = angleToHorizontal(hip, shoulder);
  const normalized = Math.min(Math.abs(rawAngle), 180 - Math.abs(rawAngle));
  const trunkLean = Math.abs(90 - normalized);

  // 修复：用肩-髋垂直距离归一化（典型值约 0.15-0.25，不会接近零）
  const bodyHeight = Math.abs(shoulder.y - hip.y) || 1;
  const shoulderForward = Math.abs(shoulder.x - hip.x);

  // 头部前移
  let headForward = 0;
  if (ear) {
    headForward = Math.abs(ear.x - shoulder.x);
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
export function calculateKneeHyperextensionAngle(keypoints: PoseKeypoint33[]): number {
  const visibleSide = getVisibleSideKeypoint(keypoints, 'left');
  const { hip, knee, ankle } = visibleSide;

  if (!hip || !knee || !ankle) {
    const rightSide = getVisibleSideKeypoint(keypoints, 'right');
    if (!rightSide.hip || !rightSide.knee || !rightSide.ankle) {
      return 180; // 默认正常值
    }
    return calculateAngle(rightSide.hip, rightSide.knee, rightSide.ankle);
  }

  return calculateAngle(hip, knee, ankle);
}

/**
 * 计算躯干前倾角度（辅助指标）
 * 肩-髋连线与垂直线的夹角
 */
export function calculateTrunkLeanAngle(keypoints: PoseKeypoint33[]): number {
  const visibleSide = getVisibleSideKeypoint(keypoints, 'left');
  const { shoulder, hip } = visibleSide;

  const normalizeTrunkAngle = (rawAngle: number): number => {
    // atan2 返回 -180° 到 180°，转换为与垂直线（90°）的最小偏离
    const normalized = Math.min(Math.abs(rawAngle), 180 - Math.abs(rawAngle));
    return Math.abs(90 - normalized);
  };

  if (!shoulder || !hip) {
    const rightSide = getVisibleSideKeypoint(keypoints, 'right');
    if (!rightSide.shoulder || !rightSide.hip) {
      return 0;
    }
    return normalizeTrunkAngle(angleToHorizontal(rightSide.hip, rightSide.shoulder));
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
