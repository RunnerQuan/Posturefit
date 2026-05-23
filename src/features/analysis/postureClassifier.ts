import type { PostureAngleMetrics, PostureIssueType, PostureSeverity, PostureIssue, PoseView, CaptureMode } from '../../types';
import { ISSUE_LABELS } from '../../data/exercises';

// 扩展阈值配置，支持所有10种体态问题
export interface PostureThresholds {
  forwardHead: { normal: number; mild: number; moderate: number };
  roundedShoulder: { normal: number; mild: number; moderate: number };
  anteriorPelvicTilt: { normalMin: number; normalMax: number; mild: number; moderate: number };
  // 新增正面视角阈值（单位：像素差值）
  shoulderImbalance: { normal: number; mild: number; moderate: number };
  pelvicTilt: { normal: number; mild: number; moderate: number };
  kneeValgus: { normal: number; mild: number; moderate: number };
  headOffset: { normal: number; mild: number; moderate: number };
  centerOfGravityShift: { normal: number; mild: number; moderate: number };
  // 新增侧面视角阈值
  hunchback: { normal: number; mild: number; moderate: number };
  kneeHyperextension: { normalMin: number; normalMax: number; mild: number; moderate: number };
}

export const DEFAULT_THRESHOLDS: PostureThresholds = {
  forwardHead: { normal: 5, mild: 10, moderate: 15 },
  roundedShoulder: { normal: 20, mild: 25, moderate: 30 },
  anteriorPelvicTilt: { normalMin: 5, normalMax: 15, mild: 20, moderate: 25 },
  // 新增正面阈值（单位：像素，后续调优）
  shoulderImbalance: { normal: 10, mild: 20, moderate: 30 },
  pelvicTilt: { normal: 10, mild: 20, moderate: 30 },
  kneeValgus: { normal: 5, mild: 15, moderate: 25 },
  headOffset: { normal: 10, mild: 20, moderate: 30 },
  centerOfGravityShift: { normal: 15, mild: 30, moderate: 45 },
  // 新增侧面阈值
  hunchback: { normal: 10, mild: 25, moderate: 40 },
  kneeHyperextension: { normalMin: 170, normalMax: 185, mild: 165, moderate: 160 },
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

// ============================================================================
// 新增问题类型的严重程度判定
// ============================================================================

function classifyPixelBasedSeverity(
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

function classifyShoulderImbalanceSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyPixelBasedSeverity(angle, thresholds.shoulderImbalance);
}

function classifyPelvicTiltSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyPixelBasedSeverity(angle, thresholds.pelvicTilt);
}

function classifyKneeValgusSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyPixelBasedSeverity(angle, thresholds.kneeValgus);
}

function classifyHeadOffsetSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyPixelBasedSeverity(angle, thresholds.headOffset);
}

function classifyCenterOfGravityShiftSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyPixelBasedSeverity(angle, thresholds.centerOfGravityShift);
}

function classifyHunchbackSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  return classifyPixelBasedSeverity(angle, thresholds.hunchback);
}

function classifyKneeHyperextensionSeverity(angle: number, thresholds: PostureThresholds): PostureSeverity {
  const { normalMin, normalMax, mild, moderate } = thresholds.kneeHyperextension;

  // 膝超伸角度在正常范围内是正常的
  if (angle >= normalMin && angle <= normalMax) {
    return 'normal';
  }
  // 角度过小（严重过伸）
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
    case 'anteriorPelvicTilt':
      severity = classifyAnteriorPelvicTiltSeverity(angle, thresholds);
      threshold = thresholds.anteriorPelvicTilt.mild;
      break;
    // 新增正面视角问题
    case 'shoulderImbalance':
      severity = classifyShoulderImbalanceSeverity(angle, thresholds);
      threshold = thresholds.shoulderImbalance.mild;
      break;
    case 'pelvicTilt':
      severity = classifyPelvicTiltSeverity(angle, thresholds);
      threshold = thresholds.pelvicTilt.mild;
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
    // 新增侧面视角问题
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

  // 对于基于像素的问题，使用px单位；角度使用°
  const isPixelBased = ['shoulderImbalance', 'pelvicTilt', 'headOffset', 'centerOfGravityShift', 'hunchback'].includes(type);
  const unit = isPixelBased ? 'px' : '°';
  const displayValue = isPixelBased ? Math.abs(angle).toFixed(1) : angle.toFixed(1);

  switch (severity) {
    case 'normal':
      return `${baseLabel}正常`;
    case 'mild':
      return `${baseLabel}轻度异常 (${displayValue}${unit})`;
    case 'moderate':
      return `${baseLabel}中度异常 (${displayValue}${unit})`;
    case 'severe':
      return `${baseLabel}严重异常 (${displayValue}${unit})`;
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
  'anteriorPelvicTilt',
  'kneeHyperextension',
];

// 拍摄模式与可分析问题的映射（根据关键点可见性）
export const MODE_ANALYZABLE_ISSUES: Record<CaptureMode, PostureIssueType[]> = {
  fullBody: [...FRONT_VIEW_ISSUES, ...SIDE_VIEW_ISSUES],  // 全部10种
  halfBody: [
    'forwardHead',           // 需要头部（鼻子、耳朵）
    'roundedShoulder',       // 需要肩部
    'shoulderImbalance',     // 需要肩部
    'headOffset',            // 需要头部
    'anteriorPelvicTilt',   // 需要髋部
    'pelvicTilt',           // 需要髋部
    // 缺少膝盖/脚踝：无法分析 kneeValgus, centerOfGravityShift, hunchback, kneeHyperextension
  ],
  closeUp: [
    'forwardHead',           // 需要头部
    'roundedShoulder',       // 需要肩部
    'shoulderImbalance',     // 需要肩部
    'headOffset',            // 需要头部
    // 只到肩颈：只能分析这些问题
  ],
  sitting: [
    'forwardHead',           // 需要头部
    'roundedShoulder',       // 需要肩部
    'shoulderImbalance',     // 需要肩部
    'headOffset',            // 需要头部
    'anteriorPelvicTilt',   // 需要髋部
    'pelvicTilt',           // 需要髋部
    // 缺少脚踝：无法分析 kneeValgus, centerOfGravityShift, hunchback, kneeHyperextension
  ],
};

export function classifyAllPostureIssues(
  metrics: PostureAngleMetrics,
  thresholds: PostureThresholds = DEFAULT_THRESHOLDS,
  view?: PoseView,
  captureMode?: CaptureMode
): PostureIssue[] {
  // 获取该模式下可分析的问题类型
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
    const value = (metrics as Record<string, number>)[type];
    if (value !== undefined) {
      issues.push(classifyPostureIssue(type, value, thresholds, view || 'front'));
    }
  }

  return issues;
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
