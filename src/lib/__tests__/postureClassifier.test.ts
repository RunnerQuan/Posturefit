import { describe, it, expect } from 'vitest';
import type { PostureIssue } from '../../types';
import {
  classifyPostureIssue,
  classifyAllPostureIssues,
  findPrimaryIssue,
  calculatePostureScore,
  DEFAULT_THRESHOLDS,
} from '../../features/analysis/postureClassifier';

describe('classifyPostureIssue', () => {
  describe('forwardHead', () => {
    it('should classify normal forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 3, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('normal');
    });

    it('should classify mild forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 7, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('mild');
    });

    it('should classify moderate forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 12, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('moderate');
    });

    it('should classify severe forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 18, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('severe');
    });
  });

  describe('roundedShoulder', () => {
    it('should classify normal rounded shoulder angle', () => {
      const result = classifyPostureIssue('roundedShoulder', 15, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('normal');
    });

    it('should classify mild rounded shoulder angle', () => {
      const result = classifyPostureIssue('roundedShoulder', 22, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('mild');
    });

    it('should classify moderate rounded shoulder angle', () => {
      const result = classifyPostureIssue('roundedShoulder', 28, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('moderate');
    });

    it('should classify severe rounded shoulder angle', () => {
      const result = classifyPostureIssue('roundedShoulder', 35, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('severe');
    });
  });

  describe('anteriorPelvicTilt', () => {
    it('should classify normal anterior pelvic tilt angle', () => {
      const result = classifyPostureIssue('anteriorPelvicTilt', 10, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('normal');
    });

    it('should classify mild anterior pelvic tilt angle', () => {
      const result = classifyPostureIssue('anteriorPelvicTilt', 18, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('mild');
    });

    it('should classify moderate anterior pelvic tilt angle', () => {
      const result = classifyPostureIssue('anteriorPelvicTilt', 23, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('moderate');
    });

    it('should classify severe anterior pelvic tilt angle', () => {
      const result = classifyPostureIssue('anteriorPelvicTilt', 30, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('severe');
    });

    it('should handle low anterior pelvic tilt angle', () => {
      const result = classifyPostureIssue('anteriorPelvicTilt', 2, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('mild');
    });
  });
});

describe('classifyAllPostureIssues', () => {
  it('should classify all posture issues', () => {
    const metrics = {
      forwardHeadAngle: 12,
      roundedShoulderAngle: 35,
      anteriorTiltAngle: 18,
      shoulderImbalance: 0,
      pelvicTilt: 0,
      kneeValgus: 0,
      headOffset: 0,
      centerOfGravityShift: 0,
      hunchback: 0,
      kneeHyperextension: 180,
    };

    const issues = classifyAllPostureIssues(metrics);

    expect(issues.length).toBeGreaterThanOrEqual(3);
    expect(issues.find(i => i.type === 'forwardHead')?.severity).toBe('moderate');
    expect(issues.find(i => i.type === 'roundedShoulder')?.severity).toBe('severe');
    expect(issues.find(i => i.type === 'anteriorPelvicTilt')?.severity).toBe('mild');
  });
});

describe('findPrimaryIssue', () => {
  it('should return null when all issues are normal', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 3, threshold: 5, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 15, threshold: 20, label: '圆肩正常', view: 'side' },
      { type: 'anteriorPelvicTilt', severity: 'normal', angle: 10, threshold: 5, label: '骨盆前倾正常', view: 'side' },
    ];

    const primary = findPrimaryIssue(issues);

    expect(primary).toBeNull();
  });

  it('should return the most severe issue', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'mild', angle: 7, threshold: 5, label: '头前伸轻度异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'severe', angle: 35, threshold: 20, label: '圆肩严重异常', view: 'side' },
      { type: 'anteriorPelvicTilt', severity: 'moderate', angle: 22, threshold: 5, label: '骨盆前倾中度异常', view: 'side' },
    ];

    const primary = findPrimaryIssue(issues);

    expect(primary).toBe('roundedShoulder');
  });

  it('should return moderate over mild', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'mild', angle: 7, threshold: 5, label: '头前伸轻度异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'moderate', angle: 25, threshold: 20, label: '圆肩中度异常', view: 'side' },
    ];

    const primary = findPrimaryIssue(issues);

    expect(primary).toBe('roundedShoulder');
  });
});

describe('calculatePostureScore', () => {
  it('should return 100 for all normal issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 3, threshold: 5, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 15, threshold: 20, label: '圆肩正常', view: 'side' },
      { type: 'anteriorPelvicTilt', severity: 'normal', angle: 10, threshold: 5, label: '骨盆前倾正常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBe(100);
  });

  it('should deduct points for mild issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'mild', angle: 7, threshold: 5, label: '头前伸轻度异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 15, threshold: 20, label: '圆肩正常', view: 'side' },
      { type: 'anteriorPelvicTilt', severity: 'normal', angle: 10, threshold: 5, label: '骨盆前倾正常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBe(85);
  });

  it('should deduct more points for severe issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 3, threshold: 5, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'severe', angle: 35, threshold: 20, label: '圆肩严重异常', view: 'side' },
      { type: 'anteriorPelvicTilt', severity: 'normal', angle: 10, threshold: 5, label: '骨盆前倾正常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBe(60);
  });

  it('should not return negative scores', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'severe', angle: 18, threshold: 5, label: '头前伸严重异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'severe', angle: 35, threshold: 20, label: '圆肩严重异常', view: 'side' },
      { type: 'anteriorPelvicTilt', severity: 'severe', angle: 30, threshold: 5, label: '骨盆前倾严重异常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBeGreaterThanOrEqual(0);
  });
});
