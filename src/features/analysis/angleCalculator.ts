import type { PoseKeypoint17, KeypointName, PostureAngleMetrics } from '../../types';
import { getKeypointByName } from '../pose/normalizeKeypoints';
import type { Point } from '../../lib/math';

export function getPoint(keypoints: PoseKeypoint17[], name: KeypointName): Point | null {
  const kp = getKeypointByName(keypoints, name);
  if (!kp || kp.score < 0.3) {
    return null;
  }
  return { x: kp.x, y: kp.y };
}

function averagePoint(left: Point | null, right: Point | null): Point | null {
  if (left && right) {
    return {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2,
    };
  }

  return left ?? right;
}

function verticalDeviationAngle(top: Point, bottom: Point): number {
  const dx = top.x - bottom.x;
  const dy = Math.abs(top.y - bottom.y);

  if (dy === 0) {
    return 90;
  }

  return Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));
}

export function calculateForwardHeadAngle(keypoints: PoseKeypoint17[]): number {
  const ear = averagePoint(getPoint(keypoints, 'leftEar'), getPoint(keypoints, 'rightEar'));
  const shoulder = averagePoint(getPoint(keypoints, 'leftShoulder'), getPoint(keypoints, 'rightShoulder'));

  if (!ear || !shoulder) {
    return 0;
  }

  return verticalDeviationAngle(ear, shoulder);
}

export function calculateRoundedShoulderAngle(keypoints: PoseKeypoint17[]): number {
  const shoulder = averagePoint(getPoint(keypoints, 'leftShoulder'), getPoint(keypoints, 'rightShoulder'));
  const hip = averagePoint(getPoint(keypoints, 'leftHip'), getPoint(keypoints, 'rightHip'));

  if (!shoulder || !hip) {
    return 0;
  }

  return verticalDeviationAngle(shoulder, hip);
}

export function calculateAnteriorPelvicTiltAngle(keypoints: PoseKeypoint17[]): number {
  const hip = averagePoint(getPoint(keypoints, 'leftHip'), getPoint(keypoints, 'rightHip'));
  const ankle = averagePoint(getPoint(keypoints, 'leftAnkle'), getPoint(keypoints, 'rightAnkle'));

  if (!hip || !ankle) {
    return 0;
  }

  return verticalDeviationAngle(hip, ankle);
}

export function calculateAllPostureAngles(keypoints: PoseKeypoint17[]): PostureAngleMetrics {
  return {
    forwardHeadAngle: calculateForwardHeadAngle(keypoints),
    roundedShoulderAngle: calculateRoundedShoulderAngle(keypoints),
    anteriorTiltAngle: calculateAnteriorPelvicTiltAngle(keypoints),
  };
}
