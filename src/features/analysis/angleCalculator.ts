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

export function calculateAllPostureAngles(keypoints: PoseKeypoint17[]): PostureAngleMetrics {
  return {
    forwardHeadAngle: calculateForwardHeadAngle(keypoints),
    roundedShoulderAngle: calculateRoundedShoulderAngle(keypoints),
    anteriorTiltAngle: calculateAnteriorPelvicTiltAngle(keypoints),
  };
}
