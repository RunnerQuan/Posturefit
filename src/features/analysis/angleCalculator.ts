import type { PoseKeypoint17, KeypointName, PostureAngleMetrics } from '../../types';
import { getKeypointByName } from '../pose/normalizeKeypoints';
import { calculateAngle, midpoint, type Point } from '../../lib/math';

export function getPoint(keypoints: PoseKeypoint17[], name: KeypointName): Point | null {
  const kp = getKeypointByName(keypoints, name);
  if (!kp || kp.score < 0.3) {
    return null;
  }
  return { x: kp.x, y: kp.y };
}

export function calculateForwardHeadAngle(keypoints: PoseKeypoint17[]): number {
  const ear = getPoint(keypoints, 'leftEar');
  const shoulder = getPoint(keypoints, 'leftShoulder');
  const nose = getPoint(keypoints, 'nose');

  if (!ear || !shoulder || !nose) {
    const rightEar = getPoint(keypoints, 'rightEar');
    const rightShoulder = getPoint(keypoints, 'rightShoulder');
    if (rightEar && rightShoulder && nose) {
      const neck = midpoint(shoulder || rightShoulder, nose);
      return calculateAngle(rightEar, rightShoulder, neck);
    }
    return 0;
  }

  const neck = midpoint(shoulder, nose);
  return calculateAngle(ear, shoulder, neck);
}

export function calculateRoundedShoulderAngle(keypoints: PoseKeypoint17[]): number {
  const shoulder = getPoint(keypoints, 'leftShoulder');
  const elbow = getPoint(keypoints, 'leftElbow');
  const hip = getPoint(keypoints, 'leftHip');

  if (!shoulder || !elbow || !hip) {
    const rightShoulder = getPoint(keypoints, 'rightShoulder');
    const rightElbow = getPoint(keypoints, 'rightElbow');
    const rightHip = getPoint(keypoints, 'rightHip');
    if (rightShoulder && rightElbow && rightHip) {
      return calculateAngle(rightShoulder, rightElbow, rightHip);
    }
    return 0;
  }

  return calculateAngle(shoulder, elbow, hip);
}

export function calculateAnteriorPelvicTiltAngle(keypoints: PoseKeypoint17[]): number {
  const hip = getPoint(keypoints, 'leftHip');
  const knee = getPoint(keypoints, 'leftKnee');
  const ankle = getPoint(keypoints, 'leftAnkle');

  if (!hip || !knee || !ankle) {
    const rightHip = getPoint(keypoints, 'rightHip');
    const rightKnee = getPoint(keypoints, 'rightKnee');
    const rightAnkle = getPoint(keypoints, 'rightAnkle');
    if (rightHip && rightKnee && rightAnkle) {
      return calculateAngle(rightHip, rightKnee, rightAnkle);
    }
    return 0;
  }

  return calculateAngle(hip, knee, ankle);
}

// ============================================================================
// 正面视角指标计算
// ============================================================================

/**
 * 高低肩：计算左右肩的y坐标差值（正值表示左肩高于右肩）
 */
export function calculateShoulderImbalance(keypoints: PoseKeypoint17[]): number {
  const leftShoulder = getPoint(keypoints, 'leftShoulder');
  const rightShoulder = getPoint(keypoints, 'rightShoulder');

  if (!leftShoulder || !rightShoulder) {
    return 0;
  }

  return leftShoulder.y - rightShoulder.y; // 正值：左肩高，负值：右肩高
}

/**
 * 骨盆侧倾：计算左右髋的y坐标差值
 */
export function calculatePelvicTilt(keypoints: PoseKeypoint17[]): number {
  const leftHip = getPoint(keypoints, 'leftHip');
  const rightHip = getPoint(keypoints, 'rightHip');

  if (!leftHip || !rightHip) {
    return 0;
  }

  return leftHip.y - rightHip.y;
}

/**
 * 膝内扣：计算膝盖相对于脚踝的水平偏移
 * 计算左右两侧膝盖x相对于对应脚踝x的偏移，取平均值
 */
export function calculateKneeValgus(keypoints: PoseKeypoint17[]): number {
  const leftKnee = getPoint(keypoints, 'leftKnee');
  const leftAnkle = getPoint(keypoints, 'leftAnkle');
  const rightKnee = getPoint(keypoints, 'rightKnee');
  const rightAnkle = getPoint(keypoints, 'rightAnkle');

  let leftOffset = 0;
  let rightOffset = 0;
  let count = 0;

  if (leftKnee && leftAnkle) {
    leftOffset = leftKnee.x - leftAnkle.x;
    count++;
  }

  if (rightKnee && rightAnkle) {
    rightOffset = rightKnee.x - rightAnkle.x;
    count++;
  }

  if (count === 0) {
    return 0;
  }

  return (leftOffset + rightOffset) / count;
}

/**
 * 头部左右偏移：计算头部相对于躯干中线的水平偏移
 */
export function calculateHeadOffset(keypoints: PoseKeypoint17[]): number {
  const nose = getPoint(keypoints, 'nose');
  const leftShoulder = getPoint(keypoints, 'leftShoulder');
  const rightShoulder = getPoint(keypoints, 'rightShoulder');

  if (!nose || !leftShoulder || !rightShoulder) {
    return 0;
  }

  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  return nose.x - shoulderCenterX;
}

/**
 * 身体重心偏移：计算身体重心相对于双脚中点的水平偏移
 * 重心近似为肩膀和髋部的中点
 */
export function calculateCenterOfGravityShift(keypoints: PoseKeypoint17[]): number {
  const leftShoulder = getPoint(keypoints, 'leftShoulder');
  const rightShoulder = getPoint(keypoints, 'rightShoulder');
  const leftHip = getPoint(keypoints, 'leftHip');
  const rightHip = getPoint(keypoints, 'rightHip');
  const leftAnkle = getPoint(keypoints, 'leftAnkle');
  const rightAnkle = getPoint(keypoints, 'rightAnkle');

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) {
    return 0;
  }

  // 计算重心（肩膀和髋部的中点）
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;

  const centerOfGravityX = (shoulderCenterX + hipCenterX) / 2;

  // 计算双脚中点
  const feetCenterX = (leftAnkle.x + rightAnkle.x) / 2;

  return centerOfGravityX - feetCenterX;
}

// ============================================================================
// 侧面视角指标计算
// ============================================================================

/**
 * 驼背倾向：计算肩部相对于髋部的水平偏移（正面角度）
 * 驼背时肩部会前移，相对于髋部偏前
 */
export function calculateHunchback(keypoints: PoseKeypoint17[]): number {
  const leftShoulder = getPoint(keypoints, 'leftShoulder');
  const rightShoulder = getPoint(keypoints, 'rightShoulder');
  const leftHip = getPoint(keypoints, 'leftHip');
  const rightHip = getPoint(keypoints, 'rightHip');

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return 0;
  }

  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;

  return shoulderCenterX - hipCenterX; // 正值表示肩部在髋部前方
}

/**
 * 膝超伸：计算髋-膝-踝的角度
 * 膝超伸时角度会小于正常值（正常约170-180度）
 */
export function calculateKneeHyperextension(keypoints: PoseKeypoint17[]): number {
  const hip = getPoint(keypoints, 'leftHip');
  const knee = getPoint(keypoints, 'leftKnee');
  const ankle = getPoint(keypoints, 'leftAnkle');

  if (!hip || !knee || !ankle) {
    const rightHip = getPoint(keypoints, 'rightHip');
    const rightKnee = getPoint(keypoints, 'rightKnee');
    const rightAnkle = getPoint(keypoints, 'rightAnkle');
    if (rightHip && rightKnee && rightAnkle) {
      return calculateAngle(rightHip, rightKnee, rightAnkle);
    }
    return 180;
  }

  return calculateAngle(hip, knee, ankle);
}

export function calculateAllPostureAngles(keypoints: PoseKeypoint17[]): PostureAngleMetrics {
  return {
    // 正面视角
    forwardHeadAngle: calculateForwardHeadAngle(keypoints),
    shoulderImbalance: calculateShoulderImbalance(keypoints),
    pelvicTilt: calculatePelvicTilt(keypoints),
    kneeValgus: calculateKneeValgus(keypoints),
    headOffset: calculateHeadOffset(keypoints),
    centerOfGravityShift: calculateCenterOfGravityShift(keypoints),
    // 侧面视角
    roundedShoulderAngle: calculateRoundedShoulderAngle(keypoints),
    anteriorTiltAngle: calculateAnteriorPelvicTiltAngle(keypoints),
    hunchback: calculateHunchback(keypoints),
    kneeHyperextension: calculateKneeHyperextension(keypoints),
  };
}

// 导出单个视角的指标计算（用于选择性分析）
export function calculateFrontViewMetrics(keypoints: PoseKeypoint17[]): Partial<PostureAngleMetrics> {
  return {
    forwardHeadAngle: calculateForwardHeadAngle(keypoints),
    shoulderImbalance: calculateShoulderImbalance(keypoints),
    pelvicTilt: calculatePelvicTilt(keypoints),
    kneeValgus: calculateKneeValgus(keypoints),
    headOffset: calculateHeadOffset(keypoints),
    centerOfGravityShift: calculateCenterOfGravityShift(keypoints),
  };
}

export function calculateSideViewMetrics(keypoints: PoseKeypoint17[]): Partial<PostureAngleMetrics> {
  return {
    roundedShoulderAngle: calculateRoundedShoulderAngle(keypoints),
    anteriorTiltAngle: calculateAnteriorPelvicTiltAngle(keypoints),
    hunchback: calculateHunchback(keypoints),
    kneeHyperextension: calculateKneeHyperextension(keypoints),
  };
}
