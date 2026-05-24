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
      // CVA 角度越大越好（正常 >= 50°）
      const result = classifyPostureIssue('forwardHead', 55, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('normal');
    });

    it('should classify mild forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 47, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('mild');
    });

    it('should classify moderate forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 42, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('moderate');
    });

    it('should classify severe forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 35, DEFAULT_THRESHOLDS);
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

  describe('shoulderImbalance', () => {
    it('should classify normal shoulder imbalance angle', () => {
      const result = classifyPostureIssue('shoulderImbalance', 1, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('normal');
    });

    it('should classify mild shoulder imbalance angle', () => {
      const result = classifyPostureIssue('shoulderImbalance', 4, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('mild');
    });

    it('should classify moderate shoulder imbalance angle', () => {
      const result = classifyPostureIssue('shoulderImbalance', 8, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('moderate');
    });

    it('should classify severe shoulder imbalance angle', () => {
      const result = classifyPostureIssue('shoulderImbalance', 15, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('severe');
    });
  });

  describe('kneeHyperextension', () => {
    it('should classify normal knee hyperextension angle', () => {
      const result = classifyPostureIssue('kneeHyperextension', 178, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('normal');
    });

    it('should classify mild knee hyperextension angle', () => {
      const result = classifyPostureIssue('kneeHyperextension', 167, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('mild');
    });

    it('should classify moderate knee hyperextension angle', () => {
      const result = classifyPostureIssue('kneeHyperextension', 162, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('moderate');
    });

    it('should classify severe knee hyperextension angle', () => {
      const result = classifyPostureIssue('kneeHyperextension', 155, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('severe');
    });
  });
});

describe('classifyAllPostureIssues', () => {
  it('should classify all posture issues', () => {
    const metrics = {
      forwardHeadAngle: 40,
      roundedShoulderAngle: 35,
      shoulderImbalanceAngle: 8,
      pelvicTiltAngle: 8,
      kneeValgusAngle: 12,
      headOffsetAngle: 6,
      centerOfGravityShiftAngle: 6,
      hunchbackAngle: 6,
      kneeHyperextensionAngle: 162,
      trunkLeanAngle: 0,
    };

    const issues = classifyAllPostureIssues(metrics);

    expect(issues.length).toBeGreaterThanOrEqual(6);
    expect(issues.find(i => i.type === 'roundedShoulder')?.severity).toBe('severe');
    expect(issues.find(i => i.type === 'forwardHead')?.severity).toBe('moderate');
    expect(issues.find(i => i.type === 'kneeHyperextension')?.severity).toBe('moderate');
  });
});

describe('findPrimaryIssue', () => {
  it('should return null when all issues are normal', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 55, threshold: 50, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 15, threshold: 20, label: '圆肩正常', view: 'side' },
      { type: 'shoulderImbalance', severity: 'normal', angle: 1, threshold: 2, label: '高低肩正常', view: 'front' },
    ];

    const primary = findPrimaryIssue(issues);

    expect(primary).toBeNull();
  });

  it('should return the most severe issue', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'mild', angle: 47, threshold: 45, label: '头前伸轻度异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'severe', angle: 35, threshold: 25, label: '圆肩严重异常', view: 'side' },
      { type: 'shoulderImbalance', severity: 'moderate', angle: 8, threshold: 5, label: '高低肩中度异常', view: 'front' },
    ];

    const primary = findPrimaryIssue(issues);

    expect(primary).toBe('roundedShoulder');
  });

  it('should return moderate over mild', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'mild', angle: 47, threshold: 45, label: '头前伸轻度异常', view: 'front' },
      { type: 'shoulderImbalance', severity: 'moderate', angle: 8, threshold: 5, label: '高低肩中度异常', view: 'front' },
    ];

    const primary = findPrimaryIssue(issues);

    expect(primary).toBe('shoulderImbalance');
  });
});

describe('calculatePostureScore', () => {
  it('should return 100 for all normal issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 55, threshold: 50, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 15, threshold: 20, label: '圆肩正常', view: 'side' },
      { type: 'shoulderImbalance', severity: 'normal', angle: 1, threshold: 2, label: '高低肩正常', view: 'front' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBe(100);
  });

  it('should deduct points for mild issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'mild', angle: 47, threshold: 45, label: '头前伸轻度异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 15, threshold: 20, label: '圆肩正常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBe(85);
  });

  it('should deduct more points for severe issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 55, threshold: 50, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'severe', angle: 35, threshold: 25, label: '圆肩严重异常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBe(60);
  });

  it('should not return negative scores', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'severe', angle: 35, threshold: 40, label: '头前伸严重异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'severe', angle: 35, threshold: 25, label: '圆肩严重异常', view: 'side' },
      { type: 'shoulderImbalance', severity: 'severe', angle: 15, threshold: 12, label: '高低肩严重异常', view: 'front' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBeGreaterThanOrEqual(0);
  });
});
