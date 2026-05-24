import type { PostureAngleMetrics, PostureIssueType, PostureSeverity, PostureIssue, PoseView, CaptureMode } from '../../types';
import { ISSUE_LABELS } from '../../data/exercises';

// =============================================================================
// 体态问题分类器
// 参考: docs/MediaPipe_BlazePose_体态识别替换技术文档.md
// =============================================================================

export interface PostureThresholds {
  // 头前伸角度（CVA近似角）
  forwardHead: { normal: number; mild: number; moderate: number };
  // 圆肩角度
  roundedShoulder: { normal: number; mild: number; moderate: number };
  // 高低肩角度（atan2斜率）
  shoulderImbalance: { normal: number; mild: number; moderate: number };
  // 骨盆侧倾角度
  pelvicTilt: { normal: number; mild: number; moderate: number };
  // 骨盆前倾角度
  anteriorPelvicTilt: { normal: number; mild: number; moderate: number };
  // 膝内扣角度（FPPA偏差）
  kneeValgus: { normal: number; mild: number; moderate: number };
  // 头部偏移角度
  headOffset: { normal: number; mild: number; moderate: number };
  // 重心偏移角度
  centerOfGravityShift: { normal: number; mild: number; moderate: number };
  // 驼背角度（加权综合）
  hunchback: { normal: number; mild: number; moderate: number };
  // 膝超伸角度（范围型）
  kneeHyperextension: { normalMin: number; normalMax: number; mild: number; moderate: number };
}

// 技术文档建议的阈值
export const DEFAULT_THRESHOLDS: PostureThresholds = {
  // 头前伸：返回偏离正常姿态(50°)的角度，偏离越大越严重
  forwardHead: { normal: 0, mild: 5, moderate: 10 },
  // 圆肩
  roundedShoulder: { normal: 20, mild: 25, moderate: 30 },
  // 高低肩：技术文档 6.4 节建议 <2° 正常, 2-5° 轻度, >5° 明显风险
  shoulderImbalance: { normal: 2, mild: 5, moderate: 12 },
  // 骨盆侧倾：技术文档 6.5 节建议 <2° 正常, 2-5° 轻度, >5° 明显风险
  pelvicTilt: { normal: 2, mild: 5, moderate: 12 },
  // 骨盆前倾：骨盆前倾角度 > 20° 视为明显异常
  anteriorPelvicTilt: { normal: 10, mild: 15, moderate: 20 },
  // 膝内扣
  kneeValgus: { normal: 5, mild: 10, moderate: 15 },
  // 头部偏移：技术文档 6.7 节建议 <3° 正常, 3-5° 轻度, >5° 明显
  headOffset: { normal: 3, mild: 5, moderate: 8 },
  // 重心偏移
  centerOfGravityShift: { normal: 3, mild: 5, moderate: 8 },
  // 驼背：技术文档 6.9 节综合评分阈值
  hunchback: { normal: 3, mild: 5, moderate: 8 },
  // 膝超伸：技术文档 6.10 节建议
  kneeHyperextension: { normalMin: 170, normalMax: 185, mild: 165, moderate: 160 },
};

function classifyAngleBasedSeverity(
  value: number,
  thresholds: { normal: number; mild: number; moderate: number }
): PostureSeverity {
  const absValue = Math.abs(value);
  if (absValue < thresholds.normal) {
    return 'normal';
  }
  if (absValue < thresholds.mild) {
    return 'mild';
  }
  if (absValue < thresholds.moderate) {
    return 'moderate';
  }
  return 'severe';
}

function classifyForwardHeadSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  // 现在 angle 是偏离正常姿态(50°)的角度，偏离越大越严重
  const deviation = Math.abs(angle); // 确保非负
  if (deviation < thresholds.forwardHead.normal) {
    return 'normal';
  }
  if (deviation < thresholds.forwardHead.mild) {
    return 'mild';
  }
  if (deviation < thresholds.forwardHead.moderate) {
    return 'moderate';
  }
  return 'severe';
}

function classifyRoundedShoulderSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.roundedShoulder);
}

function classifyShoulderImbalanceSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.shoulderImbalance);
}

function classifyPelvicTiltSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.pelvicTilt);
}

function classifyAnteriorPelvicTiltSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.anteriorPelvicTilt);
}

function classifyKneeValgusSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.kneeValgus);
}

function classifyHeadOffsetSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.headOffset);
}

function classifyCenterOfGravityShiftSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.centerOfGravityShift);
}

function classifyHunchbackSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyAngleBasedSeverity(angle, thresholds.hunchback);
}

function classifyKneeHyperextensionSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  const { normalMin, normalMax, mild, moderate } = thresholds.kneeHyperextension;

  if (angle >= normalMin && angle <= normalMax) {
    return 'normal';
  }
  if (angle >= mild) {
    return 'mild';
  }
  if (angle >= moderate) {
    return 'moderate';
  }
  return 'severe';
}

export function classifyPostureIssue(
  type: PostureIssueType,
  angle: number,
  thresholds: PostureThresholds = DEFAULT_THRESHOLDS,
  view: PoseView = 'front'
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
    case 'shoulderImbalance':
      severity = classifyShoulderImbalanceSeverity(angle, thresholds);
      threshold = thresholds.shoulderImbalance.mild;
      break;
    case 'pelvicTilt':
      severity = classifyPelvicTiltSeverity(angle, thresholds);
      threshold = thresholds.pelvicTilt.mild;
      break;
    case 'anteriorPelvicTilt':
      severity = classifyAnteriorPelvicTiltSeverity(angle, thresholds);
      threshold = thresholds.anteriorPelvicTilt.mild;
      break;
    case 'kneeValgus':
      severity = classifyKneeValgusSeverity(angle, thresholds);
      threshold = thresholds.kneeValgus.mild;
      break;
    case 'headOffset':
      severity = classifyHeadOffsetSeverity(angle, thresholds);
      threshold = thresholds.headOffset.mild;
      break;
    case 'centerOfGravityShift':
      severity = classifyCenterOfGravityShiftSeverity(angle, thresholds);
      threshold = thresholds.centerOfGravityShift.mild;
      break;
    case 'hunchback':
      severity = classifyHunchbackSeverity(angle, thresholds);
      threshold = thresholds.hunchback.mild;
      break;
    case 'kneeHyperextension':
      severity = classifyKneeHyperextensionSeverity(angle, thresholds);
      threshold = thresholds.kneeHyperextension.mild;
      break;
  }

  const label = getIssueLabel(type, severity, angle);

  return {
    type,
    severity,
    angle,
    threshold,
    label,
    view,
  };
}

function getIssueLabel(type: PostureIssueType, severity: PostureSeverity, angle: number): string {
  const baseLabel = ISSUE_LABELS[type];
  const displayValue = Math.abs(angle).toFixed(1);

  switch (severity) {
    case 'normal':
      return `${baseLabel}正常`;
    case 'mild':
      return `${baseLabel}轻度异常 (${displayValue}°)`;
    case 'moderate':
      return `${baseLabel}中度异常 (${displayValue}°)`;
    case 'severe':
      return `${baseLabel}严重异常 (${displayValue}°)`;
  }
}

// 正面视角可检测的问题类型
export const FRONT_VIEW_ISSUES: PostureIssueType[] = [
  'shoulderImbalance',
  'pelvicTilt',
  'kneeValgus',
  'headOffset',
  'centerOfGravityShift',
  'forwardHead',
];

// 侧面视角可检测的问题类型
export const SIDE_VIEW_ISSUES: PostureIssueType[] = [
  'roundedShoulder',
  'hunchback',
  'kneeHyperextension',
];

// 拍摄模式与可分析问题的映射（根据关键点可见性）
export const MODE_ANALYZABLE_ISSUES: Record<CaptureMode, PostureIssueType[]> = {
  fullBody: [...FRONT_VIEW_ISSUES, ...SIDE_VIEW_ISSUES],
  halfBody: [
    'forwardHead',
    'roundedShoulder',
    'shoulderImbalance',
    'headOffset',
    'pelvicTilt',
  ],
  closeUp: [
    'forwardHead',
    'roundedShoulder',
    'shoulderImbalance',
    'headOffset',
  ],
  sitting: [
    'forwardHead',
    'roundedShoulder',
    'shoulderImbalance',
    'headOffset',
    'pelvicTilt',
  ],
};

export function classifyAllPostureIssues(
  metrics: PostureAngleMetrics,
  thresholds: PostureThresholds = DEFAULT_THRESHOLDS,
  view?: PoseView,
  captureMode?: CaptureMode
): PostureIssue[] {
  const analyzableIssues = captureMode
    ? MODE_ANALYZABLE_ISSUES[captureMode]
    : undefined;

  const issueTypes: PostureIssueType[] = view === 'side'
    ? SIDE_VIEW_ISSUES.filter(type => !analyzableIssues || analyzableIssues.includes(type))
    : view === 'front'
    ? FRONT_VIEW_ISSUES.filter(type => !analyzableIssues || analyzableIssues.includes(type))
    : (analyzableIssues || [...FRONT_VIEW_ISSUES, ...SIDE_VIEW_ISSUES]);

  const issues: PostureIssue[] = [];

  for (const type of issueTypes) {
    const metricKey = getMetricKey(type);
    const value = (metrics as Record<string, number>)[metricKey];
    if (value !== undefined) {
      issues.push(classifyPostureIssue(type, value, thresholds, view || 'front'));
    }
  }

  return issues;
}

function getMetricKey(type: PostureIssueType): string {
  const mapping: Record<PostureIssueType, string> = {
    forwardHead: 'forwardHeadAngle',
    roundedShoulder: 'roundedShoulderAngle',
    shoulderImbalance: 'shoulderImbalanceAngle',
    pelvicTilt: 'pelvicTiltAngle',
    anteriorPelvicTilt: 'anteriorTiltAngle',
    kneeValgus: 'kneeValgusAngle',
    headOffset: 'headOffsetAngle',
    centerOfGravityShift: 'centerOfGravityShiftAngle',
    hunchback: 'hunchbackAngle',
    kneeHyperextension: 'kneeHyperextensionAngle',
  };
  return mapping[type];
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
