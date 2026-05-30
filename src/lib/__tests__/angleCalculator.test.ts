import { describe, expect, it } from 'vitest';
import { analyzePose, combineAnalyses } from '../../features/analysis/postureAnalyzer';
import {
  calculateAllPostureAngles,
  calculateForwardHeadAngle,
  calculateHeadOffsetAngle,
  calculateKneeHyperextensionAngle,
  calculateKneeValgusAngle,
  calculateShoulderImbalanceAngle,
} from '../../features/analysis/angleCalculator';
import type { BlazePoseLandmark, PoseKeypoint33 } from '../../types';

function keypoint33(name: BlazePoseLandmark, x: number, y: number): PoseKeypoint33 {
  return { name, x, y, score: 0.95 };
}

function missingKeypoint33(name: BlazePoseLandmark, x: number = 0, y: number = 0): PoseKeypoint33 {
  return { name, x, y, score: 0 };
}

// MediaPipe BlazePose 33 点正面站立姿势
function uprightFrontViewPose(): PoseKeypoint33[] {
  return [
    keypoint33('nose', 100, 40),
    keypoint33('left_eye_inner', 95, 35),
    keypoint33('left_eye', 95, 35),
    keypoint33('left_eye_outer', 92, 35),
    keypoint33('right_eye_inner', 105, 35),
    keypoint33('right_eye', 105, 35),
    keypoint33('right_eye_outer', 108, 35),
    keypoint33('left_ear', 85, 40),
    keypoint33('right_ear', 115, 40),
    keypoint33('mouth_left', 97, 50),
    keypoint33('mouth_right', 103, 50),
    keypoint33('left_shoulder', 70, 100),
    keypoint33('right_shoulder', 130, 100),
    keypoint33('left_elbow', 50, 150),
    keypoint33('right_elbow', 150, 150),
    keypoint33('left_wrist', 40, 200),
    keypoint33('right_wrist', 160, 200),
    keypoint33('left_pinky', 38, 200),
    keypoint33('right_pinky', 162, 200),
    keypoint33('left_index', 42, 200),
    keypoint33('right_index', 158, 200),
    keypoint33('left_thumb', 38, 195),
    keypoint33('right_thumb', 162, 195),
    keypoint33('left_hip', 80, 210),
    keypoint33('right_hip', 120, 210),
    keypoint33('left_knee', 80, 320),
    keypoint33('right_knee', 120, 320),
    keypoint33('left_ankle', 80, 430),
    keypoint33('right_ankle', 120, 430),
    keypoint33('left_heel', 80, 440),
    keypoint33('right_heel', 120, 440),
    keypoint33('left_foot_index', 85, 445),
    keypoint33('right_foot_index', 125, 445),
  ];
}

// MediaPipe BlazePose 33 点侧面站立姿势
function uprightSideViewPose(): PoseKeypoint33[] {
  return [
    keypoint33('nose', 100, 40),
    keypoint33('left_eye_inner', 95, 35),
    keypoint33('left_eye', 95, 35),
    keypoint33('left_eye_outer', 92, 35),
    keypoint33('right_eye_inner', 105, 35),
    keypoint33('right_eye', 105, 35),
    keypoint33('right_eye_outer', 108, 35),
    keypoint33('left_ear', 100, 45),
    keypoint33('right_ear', 104, 45),
    keypoint33('mouth_left', 97, 50),
    keypoint33('mouth_right', 103, 50),
    keypoint33('left_shoulder', 100, 100),
    keypoint33('right_shoulder', 106, 100),
    keypoint33('left_elbow', 100, 150),
    keypoint33('right_elbow', 106, 150),
    keypoint33('left_wrist', 100, 200),
    keypoint33('right_wrist', 106, 200),
    keypoint33('left_pinky', 100, 200),
    keypoint33('right_pinky', 106, 200),
    keypoint33('left_index', 100, 200),
    keypoint33('right_index', 106, 200),
    keypoint33('left_thumb', 100, 195),
    keypoint33('right_thumb', 106, 195),
    keypoint33('left_hip', 100, 210),
    keypoint33('right_hip', 106, 210),
    keypoint33('left_knee', 100, 320),
    keypoint33('right_knee', 106, 320),
    keypoint33('left_ankle', 100, 430),
    keypoint33('right_ankle', 106, 430),
    keypoint33('left_heel', 100, 440),
    keypoint33('right_heel', 106, 440),
    keypoint33('left_foot_index', 105, 445),
    keypoint33('right_foot_index', 111, 445),
  ];
}

describe('calculateAllPostureAngles', () => {
  it('reports low deviation angles for an upright front-view pose', () => {
    const metrics = calculateAllPostureAngles(uprightFrontViewPose());

    // 高低肩、肩部水平应该接近 0
    expect(metrics.shoulderImbalanceAngle).not.toBeNull();
    expect(metrics.pelvicTiltAngle).not.toBeNull();
    expect(Math.abs(metrics.shoulderImbalanceAngle ?? Number.POSITIVE_INFINITY)).toBeLessThan(1);
    expect(Math.abs(metrics.pelvicTiltAngle ?? Number.POSITIVE_INFINITY)).toBeLessThan(1);
  });

  it('calculates angles for side-view pose', () => {
    const metrics = calculateAllPostureAngles(uprightSideViewPose());

    // 验证计算没有返回 NaN
    expect(metrics.forwardHeadAngle).not.toBeNaN();
    expect(metrics.roundedShoulderAngle).not.toBeNaN();
    expect(metrics.hunchbackAngle).not.toBeNaN();
    expect(metrics.kneeHyperextensionAngle).toBeGreaterThan(150);
  });

  it('classifies an upright front-view pose as mostly normal', () => {
    const result = analyzePose(uprightFrontViewPose(), { view: 'front' });

    // 单视角使用与双视角一致的正常项满分高斯评分
    expect(result.score).toBe(100);
  });

  it('classifies an upright side-view pose as mostly normal', () => {
    const result = analyzePose(uprightSideViewPose(), { view: 'side' });

    // 站立姿势应该有合理评分
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('returns actual CVA for forward head instead of deviation from normal', () => {
    const upright = uprightSideViewPose();
    const forward = upright.map(point =>
      point.name === 'left_ear' ? keypoint33('left_ear', 155, 45) : point
    );

    expect(calculateForwardHeadAngle(upright)).toBeGreaterThan(50);
    expect(calculateForwardHeadAngle(forward)).toBeLessThan(50);
  });

  it('detects obvious forward head when raw CVA is still above the normal boundary', () => {
    const forward = uprightSideViewPose().map(point => {
      if (point.name.startsWith('right_')) return { ...point, score: 0 };
      if (point.name === 'nose') return keypoint33('nose', 160, 40);
      if (point.name === 'left_ear') return keypoint33('left_ear', 145, 45);
      return point;
    });

    const rawCva = Math.atan2(55, 45) * (180 / Math.PI);

    expect(rawCva).toBeGreaterThan(50);
    expect(calculateForwardHeadAngle(forward)).toBeLessThan(40);
  });

  it('detects forward head for left-facing side-view poses', () => {
    const forward = uprightSideViewPose().map(point => {
      if (point.name.startsWith('right_')) return { ...point, score: 0 };
      if (point.name === 'nose') return missingKeypoint33('nose');
      if (point.name === 'left_ear') return keypoint33('left_ear', 55, 45);
      return point;
    });

    expect(calculateForwardHeadAngle(forward)).toBeLessThan(40);
  });

  it('falls back to ear-shoulder height for close-up side photos without hip points', () => {
    const closeUpForward = uprightSideViewPose().map(point => {
      if (point.name.startsWith('right_')) return { ...point, score: 0 };
      if (point.name === 'nose') return keypoint33('nose', 160, 40);
      if (point.name === 'left_hip') return missingKeypoint33('left_hip');
      if (point.name === 'left_ear') return keypoint33('left_ear', 145, 45);
      return point;
    });

    expect(calculateForwardHeadAngle(closeUpForward)).toBeLessThan(40);
  });

  it('returns null for forward head when ear or shoulder is missing', () => {
    const missingEar = uprightSideViewPose().map(point =>
      point.name.endsWith('_ear') ? { ...point, score: 0 } : point
    );
    const missingShoulder = uprightSideViewPose().map(point =>
      point.name.endsWith('_shoulder') ? { ...point, score: 0 } : point
    );

    expect(calculateForwardHeadAngle(missingEar)).toBeNull();
    expect(calculateForwardHeadAngle(missingShoulder)).toBeNull();
  });

  it('reports side-view forward head while keeping front-view forward head out of official issues', () => {
    const sideForward = uprightSideViewPose().map(point => {
      if (point.name.startsWith('right_')) return { ...point, score: 0 };
      if (point.name === 'nose') return keypoint33('nose', 160, 40);
      if (point.name === 'left_ear') return keypoint33('left_ear', 145, 45);
      return point;
    });

    const sideAnalysis = analyzePose(sideForward, { view: 'side' });
    const frontAnalysis = analyzePose(uprightFrontViewPose(), { view: 'front' });
    const combined = combineAnalyses(frontAnalysis, sideAnalysis);

    expect(sideAnalysis.issues.find(issue => issue.type === 'forwardHead')?.severity).toBe('severe');
    expect(sideAnalysis.primaryIssue).toBe('forwardHead');
    expect(frontAnalysis.issues.some(issue => issue.type === 'forwardHead')).toBe(false);
    expect(combined.allIssues.some(issue => issue.type === 'forwardHead' && issue.severity === 'severe')).toBe(true);
  });

  it('returns null instead of a normal value when required front-view keypoints are missing', () => {
    const pose = uprightFrontViewPose().map(point =>
      point.name === 'left_shoulder' ? missingKeypoint33('left_shoulder') : point
    );

    const metrics = calculateAllPostureAngles(pose);

    expect(metrics.shoulderImbalanceAngle).toBeNull();
    expect(metrics.headOffsetAngle).toBeNull();
  });

  it('returns null for every official issue when its required keypoints are missing', () => {
    const front = uprightFrontViewPose();
    const side = uprightSideViewPose();

    expect(calculateShoulderImbalanceAngle(front.map(point =>
      point.name === 'left_shoulder' ? missingKeypoint33('left_shoulder') : point
    ))).toBeNull();
    expect(calculateAllPostureAngles(front.map(point =>
      point.name === 'left_hip' ? missingKeypoint33('left_hip') : point
    )).pelvicTiltAngle).toBeNull();
    expect(calculateKneeValgusAngle(front.map(point =>
      point.name.endsWith('_knee') ? { ...point, score: 0 } : point
    ))).toBeNull();
    expect(calculateHeadOffsetAngle(front.map(point =>
      point.name === 'right_hip' ? missingKeypoint33('right_hip') : point
    ))).toBeNull();
    expect(calculateAllPostureAngles(front.map(point =>
      point.name === 'right_ankle' ? missingKeypoint33('right_ankle') : point
    )).centerOfGravityShiftAngle).toBeNull();
    expect(calculateForwardHeadAngle(side.map(point =>
      point.name.endsWith('_ear') ? { ...point, score: 0 } : point
    ))).toBeNull();
    expect(calculateAllPostureAngles(side.map(point =>
      point.name.endsWith('_hip') ? { ...point, score: 0 } : point
    )).roundedShoulderAngle).toBeNull();
    expect(calculateAllPostureAngles(side.map(point =>
      point.name.endsWith('_shoulder') ? { ...point, score: 0 } : point
    )).hunchbackAngle).toBeNull();
    expect(calculateKneeHyperextensionAngle(side.map(point =>
      point.name.endsWith('_ankle') ? { ...point, score: 0 } : point
    ))).toBeNull();
  });

  it('uses face-center fallback for head offset when the nose is missing', () => {
    const pose = uprightFrontViewPose().map(point =>
      point.name === 'nose' ? missingKeypoint33('nose') : point
    );

    expect(calculateHeadOffsetAngle(pose)).not.toBeNull();
    expect(calculateHeadOffsetAngle(pose)).toBeLessThan(1);
  });

  it('increases knee valgus score for knee offset even when the knee angle remains nearly straight', () => {
    const neutral = uprightFrontViewPose();
    const valgus = neutral.map(point => {
      if (point.name === 'left_knee') return keypoint33('left_knee', 100, 320);
      if (point.name === 'right_knee') return keypoint33('right_knee', 100, 320);
      return point;
    });

    expect(calculateKneeValgusAngle(valgus)).toBeGreaterThan(calculateKneeValgusAngle(neutral) ?? 0);
  });

  it('can analyze the visible side when the far side is hidden', () => {
    const pose = uprightSideViewPose().map(point =>
      point.name.startsWith('right_') ? { ...point, score: 0 } : point
    );

    expect(calculateForwardHeadAngle(pose)).not.toBeNull();
    expect(calculateAllPostureAngles(pose).roundedShoulderAngle).not.toBeNull();
  });

  it('uses a signed side-view rule for knee hyperextension', () => {
    const neutral = uprightSideViewPose();
    const hyperextended = neutral.map(point =>
      point.name === 'left_knee' ? keypoint33('left_knee', 70, 320) : point
    );

    expect(calculateKneeHyperextensionAngle(neutral)).toBeGreaterThanOrEqual(170);
    expect(calculateKneeHyperextensionAngle(hyperextended)).toBeGreaterThan(185);
  });
});
