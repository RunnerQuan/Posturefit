import { describe, expect, it } from 'vitest';
import { analyzePose } from '../../features/analysis/postureAnalyzer';
import { calculateAllPostureAngles } from '../../features/analysis/angleCalculator';
import type { KeypointName, PoseKeypoint17 } from '../../types';

function keypoint(name: KeypointName, x: number, y: number): PoseKeypoint17 {
  return { name, x, y, score: 0.95 };
}

function uprightSideViewPose(): PoseKeypoint17[] {
  return [
    keypoint('nose', 100, 40),
    keypoint('leftEye', 95, 35),
    keypoint('rightEye', 105, 35),
    keypoint('leftEar', 100, 45),
    keypoint('rightEar', 104, 45),
    keypoint('leftShoulder', 100, 100),
    keypoint('rightShoulder', 106, 100),
    keypoint('leftElbow', 100, 150),
    keypoint('rightElbow', 106, 150),
    keypoint('leftWrist', 100, 200),
    keypoint('rightWrist', 106, 200),
    keypoint('leftHip', 100, 210),
    keypoint('rightHip', 106, 210),
    keypoint('leftKnee', 100, 320),
    keypoint('rightKnee', 106, 320),
    keypoint('leftAnkle', 100, 430),
    keypoint('rightAnkle', 106, 430),
  ];
}

describe('calculateAllPostureAngles', () => {
  it('reports low deviation angles for an upright side-view pose', () => {
    const metrics = calculateAllPostureAngles(uprightSideViewPose());

    expect(metrics.forwardHeadAngle).toBeLessThan(5);
    expect(metrics.roundedShoulderAngle).toBeLessThan(5);
    expect(metrics.anteriorTiltAngle).toBeLessThan(5);
  });

  it('classifies an upright side-view pose as normal', () => {
    const result = analyzePose(uprightSideViewPose());

    expect(result.score).toBe(100);
    expect(result.primaryIssue).toBeNull();
    expect(result.issues.map(issue => issue.severity)).toEqual(['normal', 'normal', 'normal']);
  });

  it('only includes supported issues for close-up mode', () => {
    const result = analyzePose(uprightSideViewPose(), { captureMode: 'closeUp' });

    expect(result.captureMode).toBe('closeUp');
    expect(result.supportedIssueTypes).toEqual(['forwardHead']);
    expect(result.issues.map(issue => issue.type)).toEqual(['forwardHead']);
  });

  it('hides pelvic tilt for half-body mode', () => {
    const result = analyzePose(uprightSideViewPose(), { captureMode: 'halfBody' });

    expect(result.supportedIssueTypes).toEqual(['forwardHead', 'roundedShoulder']);
    expect(result.issues.map(issue => issue.type)).toEqual(['forwardHead', 'roundedShoulder']);
  });
});
