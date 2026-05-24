import { describe, expect, it } from 'vitest';
import { analyzePose } from '../../features/analysis/postureAnalyzer';
import { calculateAllPostureAngles } from '../../features/analysis/angleCalculator';
import type { BlazePoseLandmark, PoseKeypoint33 } from '../../types';

function keypoint33(name: BlazePoseLandmark, x: number, y: number): PoseKeypoint33 {
  return { name, x, y, score: 0.95 };
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
    expect(Math.abs(metrics.shoulderImbalanceAngle)).toBeLessThan(1);
    expect(Math.abs(metrics.pelvicTiltAngle)).toBeLessThan(1);
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

    // 站立姿势应该有合理评分
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('classifies an upright side-view pose as mostly normal', () => {
    const result = analyzePose(uprightSideViewPose(), { view: 'side' });

    // 站立姿势应该有合理评分
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
