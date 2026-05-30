import { describe, it, expect } from 'vitest';
import type { PostureIssue } from '../../types';
import {
  classifyPostureIssue,
  classifyAllPostureIssues,
  findPrimaryIssue,
  calculatePostureScore,
  calculateIssueScore,
  calculatePostureScoreWithNormalization,
  DEFAULT_THRESHOLDS,
} from '../../features/analysis/postureClassifier';
import { ISSUE_LABELS } from '../../data/exercises';

describe('classifyPostureIssue', () => {
  describe('forwardHead', () => {
    it('should classify normal forward head angle', () => {
      // CVA 角度越大越好（正常 >= 48°）
      const result = classifyPostureIssue('forwardHead', 55, DEFAULT_THRESHOLDS);
      expect(result.severity).toBe('normal');
    });

    it('should classify 48 degrees and 49.3 degrees as normal forward head angles', () => {
      expect(classifyPostureIssue('forwardHead', 49.3, DEFAULT_THRESHOLDS).severity).toBe('normal');
      expect(classifyPostureIssue('forwardHead', 48, DEFAULT_THRESHOLDS).severity).toBe('normal');
    });

    it('should classify mild forward head angle', () => {
      const result = classifyPostureIssue('forwardHead', 47.9, DEFAULT_THRESHOLDS);
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
  const metrics = {
    forwardHeadAngle: 40,
    roundedShoulderAngle: 35,
    shoulderImbalanceAngle: 8,
    pelvicTiltAngle: 8,
    anteriorTiltAngle: 18,
    kneeValgusAngle: 12,
    headOffsetAngle: 6,
    centerOfGravityShiftAngle: 6,
    hunchbackAngle: 6,
    kneeHyperextensionAngle: 162,
    trunkLeanAngle: 0,
  };

  it('should classify all posture issues', () => {
    const issues = classifyAllPostureIssues(metrics);

    expect(issues.length).toBeGreaterThanOrEqual(6);
    expect(issues.find(i => i.type === 'roundedShoulder')?.severity).toBe('severe');
    expect(issues.find(i => i.type === 'forwardHead')?.severity).toBe('moderate');
    expect(issues.find(i => i.type === 'kneeHyperextension')?.severity).toBe('moderate');
  });

  it('only classifies side-view issues for side mode', () => {
    const issues = classifyAllPostureIssues(metrics, DEFAULT_THRESHOLDS, 'side');

    expect(issues.map(issue => issue.type)).toEqual([
      'forwardHead',
      'roundedShoulder',
      'hunchback',
      'kneeHyperextension',
    ]);
    expect(issues.every(issue => issue.view === 'side')).toBe(true);
    expect(issues.map(issue => issue.type)).not.toContain('shoulderImbalance');
    expect(issues.map(issue => issue.type)).not.toContain('pelvicTilt');
    expect(issues.map(issue => issue.type)).not.toContain('kneeValgus');
    expect(issues.map(issue => issue.type)).not.toContain('headOffset');
    expect(issues.map(issue => issue.type)).not.toContain('centerOfGravityShift');
    expect(issues.map(issue => issue.type)).not.toContain('anteriorPelvicTilt');
  });

  it('marks null metrics as undetected', () => {
    const issues = classifyAllPostureIssues(
      {
        ...metrics,
        shoulderImbalanceAngle: null,
        kneeHyperextensionAngle: null,
      },
      DEFAULT_THRESHOLDS,
      'front'
    );

    expect(issues.find(i => i.type === 'shoulderImbalance')?.severity).toBe('undetected');
  });
});

describe('calculateIssueScore', () => {
  it('groups forward head under side-view scoring', () => {
    expect(calculateIssueScore('forwardHead', 40).view).toBe('side');
  });

  it('keeps the center-to-normal midpoint at 100 and scores the normal boundary near 90', () => {
    const centerScore = calculateIssueScore({
      type: 'roundedShoulder',
      severity: 'normal',
      angle: 0,
      threshold: 25,
      label: '圆肩倾向正常',
      view: 'side',
    });
    const midpointScore = calculateIssueScore({
      type: 'roundedShoulder',
      severity: 'normal',
      angle: 10,
      threshold: 25,
      label: '圆肩倾向正常',
      view: 'side',
    });
    const boundaryScore = calculateIssueScore({
      type: 'roundedShoulder',
      severity: 'normal',
      angle: 20,
      threshold: 25,
      label: '圆肩倾向正常',
      view: 'side',
    });

    expect(centerScore.gaussianScore).toBe(100);
    expect(midpointScore.gaussianScore).toBe(100);
    expect(boundaryScore.gaussianScore).toBeCloseTo(90, 5);
  });

  it('scores forward-head center and normal midpoint as 100, normal boundary near 90, and moderate boundary near 20', () => {
    expect(calculateIssueScore({
      type: 'forwardHead',
      severity: 'normal',
      angle: 50,
      threshold: 45,
      label: '头前伸正常',
      view: 'side',
    }).gaussianScore).toBe(100);
    expect(calculateIssueScore({
      type: 'forwardHead',
      severity: 'normal',
      angle: 49,
      threshold: 45,
      label: '头前伸正常',
      view: 'side',
    }).gaussianScore).toBe(100);
    expect(calculateIssueScore({
      type: 'forwardHead',
      severity: 'normal',
      angle: 48,
      threshold: 45,
      label: '头前伸正常',
      view: 'side',
    }).gaussianScore).toBeCloseTo(90, 5);
    const mildScore = calculateIssueScore({
      type: 'forwardHead',
      severity: 'mild',
      angle: 45,
      threshold: 45,
      label: '头前伸轻度异常',
      view: 'side',
    }).gaussianScore;
    expect(mildScore).toBeCloseTo(50, 5);
    expect(calculateIssueScore({
      type: 'forwardHead',
      severity: 'moderate',
      angle: 40,
      threshold: 40,
      label: '头前伸中度异常',
      view: 'side',
    }).gaussianScore).toBeCloseTo(20, 5);
  });

  it('scores knee hyperextension center and normal midpoint as 100, normal boundary near 90, and mild boundary near 50', () => {
    expect(calculateIssueScore({
      type: 'kneeHyperextension',
      severity: 'normal',
      angle: 177,
      threshold: 165,
      label: '膝超伸正常',
      view: 'side',
    }).gaussianScore).toBe(100);
    expect(calculateIssueScore({
      type: 'kneeHyperextension',
      severity: 'normal',
      angle: 181,
      threshold: 165,
      label: '膝超伸正常',
      view: 'side',
    }).gaussianScore).toBe(100);
    expect(calculateIssueScore({
      type: 'kneeHyperextension',
      severity: 'normal',
      angle: 185,
      threshold: 165,
      label: '膝超伸正常',
      view: 'side',
    }).gaussianScore).toBeCloseTo(90, 5);
    const abnormalScore = calculateIssueScore({
      type: 'kneeHyperextension',
      severity: 'mild',
      angle: 190,
      threshold: 165,
      label: '膝超伸轻度异常',
      view: 'side',
    }).gaussianScore;
    expect(abnormalScore).toBeCloseTo(50, 5);
  });

  it('scores mild/moderate and moderate/severe boundaries at 50 and 20', () => {
    expect(calculateIssueScore({
      type: 'roundedShoulder',
      severity: 'mild',
      angle: 25,
      threshold: 25,
      label: '圆肩倾向轻度异常',
      view: 'side',
    }).gaussianScore).toBeCloseTo(50, 5);
    expect(calculateIssueScore({
      type: 'roundedShoulder',
      severity: 'moderate',
      angle: 30,
      threshold: 30,
      label: '圆肩倾向中度异常',
      view: 'side',
    }).gaussianScore).toBeCloseTo(20, 5);
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
  it('should return 100 when all detected issues are at their ideal centers', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 55, threshold: 50, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 0, threshold: 20, label: '圆肩正常', view: 'side' },
      { type: 'shoulderImbalance', severity: 'normal', angle: 0, threshold: 2, label: '高低肩正常', view: 'front' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBe(100);
  });

  it('keeps center-to-normal-midpoint issues at 100 but normal-boundary issues near 90', () => {
    const issues: PostureIssue[] = [
      { type: 'roundedShoulder', severity: 'normal', angle: 20, threshold: 20, label: '圆肩正常', view: 'side' },
      { type: 'shoulderImbalance', severity: 'normal', angle: 2, threshold: 2, label: '高低肩正常', view: 'front' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBeCloseTo(90, 5);
  });

  it('should deduct gently for a mild issue when the other detected issue is normal', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'mild', angle: 47, threshold: 45, label: '头前伸轻度异常', view: 'front' },
      { type: 'roundedShoulder', severity: 'normal', angle: 15, threshold: 20, label: '圆肩正常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBeGreaterThan(85);
    expect(score).toBeLessThan(95);
  });

  it('should deduct more points for severe issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'normal', angle: 55, threshold: 50, label: '头前伸正常', view: 'front' },
      { type: 'roundedShoulder', severity: 'severe', angle: 35, threshold: 25, label: '圆肩严重异常', view: 'side' },
    ];

    const score = calculatePostureScore(issues);

    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(70);
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

  it('does not deduct or average undetected issues', () => {
    const issues: PostureIssue[] = [
      { type: 'forwardHead', severity: 'undetected', angle: 0, threshold: 0, label: '头前伸 — 未检测到足够的关键点', view: 'side' },
      { type: 'roundedShoulder', severity: 'normal', angle: 0, threshold: 20, label: '圆肩倾向正常', view: 'side' },
    ];

    expect(calculatePostureScore(issues)).toBe(100);
    expect(calculatePostureScoreWithNormalization(issues).finalScore).toBe(100);
  });

  it('averages center-perfect normal issues with a mild abnormal issue', () => {
    const issues: PostureIssue[] = [
      { type: 'shoulderImbalance', severity: 'normal', angle: 0, threshold: 5, label: '高低肩正常', view: 'front' },
      { type: 'pelvicTilt', severity: 'normal', angle: 0, threshold: 5, label: '骨盆侧倾正常', view: 'front' },
      { type: 'headOffset', severity: 'normal', angle: 0, threshold: 5, label: '头部偏移正常', view: 'front' },
      { type: 'kneeHyperextension', severity: 'mild', angle: 190, threshold: 165, label: '膝超伸轻度异常', view: 'side' },
    ];

    const score = calculatePostureScoreWithNormalization(issues).finalScore;

    expect(score).toBeCloseTo(87.5, 5);
    expect(calculatePostureScore(issues)).toBe(score);
  });
});

describe('issue display labels', () => {
  it('uses risk-oriented wording for side-view shoulder and back findings', () => {
    expect(ISSUE_LABELS.roundedShoulder).toBe('圆肩倾向');
    expect(ISSUE_LABELS.hunchback).toBe('驼背风险');
  });
});
