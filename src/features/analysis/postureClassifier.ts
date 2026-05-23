import type { PostureAngleMetrics, PostureIssueType, PostureSeverity, PostureIssue } from '../../types';
import { ISSUE_LABELS } from '../../data/exercises';

export interface PostureThresholds {
  forwardHead: { normal: number; mild: number; moderate: number };
  roundedShoulder: { normal: number; mild: number; moderate: number };
  anteriorPelvicTilt: { normalMin: number; normalMax: number; mild: number; moderate: number };
}

export const DEFAULT_THRESHOLDS: PostureThresholds = {
  forwardHead: { normal: 5, mild: 10, moderate: 15 },
  roundedShoulder: { normal: 20, mild: 25, moderate: 30 },
  anteriorPelvicTilt: { normalMin: 5, normalMax: 15, mild: 20, moderate: 25 },
};

function classifyForwardHeadSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  if (angle < thresholds.forwardHead.normal) {
    return 'normal';
  }
  if (angle < thresholds.forwardHead.mild) {
    return 'mild';
  }
  if (angle < thresholds.forwardHead.moderate) {
    return 'moderate';
  }
  return 'severe';
}

function classifyRoundedShoulderSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  if (angle < thresholds.roundedShoulder.normal) {
    return 'normal';
  }
  if (angle < thresholds.roundedShoulder.mild) {
    return 'mild';
  }
  if (angle < thresholds.roundedShoulder.moderate) {
    return 'moderate';
  }
  return 'severe';
}

function classifyAnteriorPelvicTiltSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  const { normalMin, normalMax, mild, moderate } = thresholds.anteriorPelvicTilt;
  
  if (angle >= normalMin && angle <= normalMax) {
    return 'normal';
  }
  if (angle < mild) {
    return 'mild';
  }
  if (angle < moderate) {
    return 'moderate';
  }
  return 'severe';
}

export function classifyPostureIssue(
  type: PostureIssueType,
  angle: number,
  thresholds: PostureThresholds = DEFAULT_THRESHOLDS
): PostureIssue {
  let severity: PostureSeverity;
  let threshold: number;

  switch (type) {
    case 'forwardHead':
      severity = classifyForwardHeadSeverity(angle, thresholds);
      threshold = thresholds.forwardHead.mild;
      break;
    case 'roundedShoulder':
      severity = classifyRoundedShoulderSeverity(angle, thresholds);
      threshold = thresholds.roundedShoulder.mild;
      break;
    case 'anteriorPelvicTilt':
      severity = classifyAnteriorPelvicTiltSeverity(angle, thresholds);
      threshold = thresholds.anteriorPelvicTilt.mild;
      break;
  }

  const label = getIssueLabel(type, severity, angle);

  return {
    type,
    severity,
    angle,
    threshold,
    label,
  };
}

function getIssueLabel(type: PostureIssueType, severity: PostureSeverity, angle: number): string {
  const baseLabel = ISSUE_LABELS[type];
  
  switch (severity) {
    case 'normal':
      return `${baseLabel}正常`;
    case 'mild':
      return `${baseLabel}轻度异常 (${angle.toFixed(1)}°)`;
    case 'moderate':
      return `${baseLabel}中度异常 (${angle.toFixed(1)}°)`;
    case 'severe':
      return `${baseLabel}严重异常 (${angle.toFixed(1)}°)`;
  }
}

export function classifyAllPostureIssues(
  metrics: PostureAngleMetrics,
  thresholds: PostureThresholds = DEFAULT_THRESHOLDS
): PostureIssue[] {
  return [
    classifyPostureIssue('forwardHead', metrics.forwardHeadAngle, thresholds),
    classifyPostureIssue('roundedShoulder', metrics.roundedShoulderAngle, thresholds),
    classifyPostureIssue('anteriorPelvicTilt', metrics.anteriorTiltAngle, thresholds),
  ];
}

export function findPrimaryIssue(issues: PostureIssue[]): PostureIssueType | null {
  const severityOrder: Record<PostureSeverity, number> = {
    normal: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
  };

  let primaryIssue: PostureIssue | null = null;

  for (const issue of issues) {
    if (issue.severity === 'normal') {
      continue;
    }

    if (!primaryIssue) {
      primaryIssue = issue;
      continue;
    }

    if (severityOrder[issue.severity] > severityOrder[primaryIssue.severity]) {
      primaryIssue = issue;
    }
  }

  return primaryIssue?.type ?? null;
}

export function calculatePostureScore(issues: PostureIssue[]): number {
  const severityWeights: Record<PostureSeverity, number> = {
    normal: 0,
    mild: 15,
    moderate: 25,
    severe: 40,
  };

  let totalDeduction = 0;
  
  for (const issue of issues) {
    if (issue.severity !== 'normal') {
      totalDeduction += severityWeights[issue.severity];
    }
  }

  return Math.max(0, 100 - totalDeduction);
}
