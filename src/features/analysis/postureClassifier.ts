import type { PostureAngleMetrics, PostureIssueType, PostureSeverity, PostureIssue, PoseView, CaptureMode, PostureIssueScore, ViewNormalizedScore } from '../../types';
import { ISSUE_LABELS } from '../../data/exercises';

// =============================================================================
// 高斯衰减评分参数
// sigma: 标准差，越小越敏感（偏离一点就大幅扣分）
// center: 理想值，该指标应该趋近的角度
// =============================================================================

export interface GaussianParam {
  sigma: number;
  center: number;
}

export const GAUSSIAN_PARAMS: Record<PostureIssueType, GaussianParam> = {
  // forwardHeadAngle 是实际 CVA 角度，50° 为理想值
  forwardHead:            { sigma: 8,  center: 50 },
  // roundedShoulderAngle 本身就是偏离20°的角度
  roundedShoulder:         { sigma: 12, center: 0 },
  // 以下都是偏差点位
  shoulderImbalance:       { sigma: 6,  center: 0 },
  pelvicTilt:              { sigma: 6,  center: 0 },
  anteriorPelvicTilt:      { sigma: 10, center: 0 },
  kneeValgus:              { sigma: 8,  center: 0 },
  headOffset:              { sigma: 5,  center: 0 },
  centerOfGravityShift:    { sigma: 5,  center: 0 },
  hunchback:               { sigma: 5,  center: 0 },
  // kneeHyperextensionAngle 是实际角度，正常范围 170-185
  kneeHyperextension:      { sigma: 8,  center: 177 },
};

function gaussianScore(angle: number, center: number, sigma: number): number {
  const deviation = Math.abs(angle - center);
  const exponent = -(deviation ** 2) / (2 * sigma ** 2);
  return 100 * Math.exp(exponent);
}

function sigmaForBoundaryScore(distanceAtBoundary: number, scoreAtBoundary: number): number {
  if (distanceAtBoundary <= 0) {
    return 1;
  }
  return distanceAtBoundary / Math.sqrt(-2 * Math.log(scoreAtBoundary / 100));
}

function gaussianScoreFromBase(deviation: number, sigma: number, baseScore: number): number {
  const exponent = -(deviation ** 2) / (2 * sigma ** 2);
  return baseScore * Math.exp(exponent);
}

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
  // 头前伸：CVA 角度阈值（越大越好）
  // normal: CVA >= 50°, mild: CVA >= 45°, moderate: CVA > 40°
  forwardHead: { normal: 50, mild: 45, moderate: 40 },
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
  // 膝超伸：技术文档 6.10 节建议，正常范围 170-185
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
  // angle 是实际 CVA 角度（越大越好），阈值表示边界值
  // normal: CVA >= 50, mild: CVA >= 45 && < 50, moderate: CVA > 40 && < 45, severe: CVA <= 40
  if (angle >= thresholds.forwardHead.normal) {
    return 'normal';
  }
  if (angle >= thresholds.forwardHead.mild) {
    return 'mild';
  }
  if (angle >= thresholds.forwardHead.moderate) {
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
  if (angle > normalMax) {
    const excess = angle - normalMax;
    if (excess < 5) {
      return 'mild';
    }
    if (excess < 10) {
      return 'moderate';
    }
    return 'severe';
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

  if (severity === 'undetected') {
    return `${baseLabel} — 未检测到足够的关键点`;
  }

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

// 正面视角可检测的问题类型（仅限真正能从正面测量的）
export const FRONT_VIEW_ISSUES: PostureIssueType[] = [
  'shoulderImbalance',
  'pelvicTilt',
  'kneeValgus',
  'headOffset',
  'centerOfGravityShift',
];

// 侧面视角可检测的问题类型
export const SIDE_VIEW_ISSUES: PostureIssueType[] = [
  'forwardHead',
  'roundedShoulder',
  'hunchback',
  'kneeHyperextension',
];

// 拍摄模式与可分析问题的映射（根据关键点可见性）
// 注意：forwardHead、roundedShoulder、hunchback 都需要侧面视角数据
// 只在侧面照或 fullBody 模式下计算
export const MODE_ANALYZABLE_ISSUES: Record<CaptureMode, PostureIssueType[]> = {
  fullBody: [...FRONT_VIEW_ISSUES, ...SIDE_VIEW_ISSUES],
  halfBody: [
    'shoulderImbalance',
    'headOffset',
    'pelvicTilt',
    'forwardHead',       // 侧面: 头前伸
    'roundedShoulder',   // 侧面: 圆肩
  ],
  closeUp: [
    'shoulderImbalance',
    'headOffset',
    'forwardHead',       // 侧面: 头前伸（仅需耳+肩）
    // roundedShoulder: 需要髋部，closeUp 模式下无髋部，不检测
  ],
  sitting: [
    'shoulderImbalance',
    'headOffset',
    'pelvicTilt',
    'forwardHead',       // 侧面: 头前伸
    'roundedShoulder',   // 侧面: 圆肩
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
    const value = (metrics as Record<string, number | null | undefined>)[metricKey];

    if (value === null) {
      // 关键点不可见，无法计算该指标
      issues.push({
        type,
        severity: 'undetected',
        angle: 0,
        threshold: 0,
        label: getIssueLabel(type, 'undetected', 0),
        view: view || 'front',
      });
    } else if (value !== undefined) {
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
    undetected: -1, // 未检测的不参与主要问题评选
  };

  let primaryIssue: PostureIssue | null = null;

  for (const issue of issues) {
    if (issue.severity === 'normal' || issue.severity === 'undetected') {
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

// =============================================================================
// 高斯衰减评分计算
// =============================================================================

function getIssueView(type: PostureIssueType): PoseView {
  const frontViewTypes: PostureIssueType[] = [
    'shoulderImbalance', 'pelvicTilt', 'kneeValgus',
    'headOffset', 'centerOfGravityShift',
  ];
  return frontViewTypes.includes(type) ? 'front' : 'side';
}

function getNormalBoundaryDistance(type: PostureIssueType, angle: number): number {
  const thresholds = DEFAULT_THRESHOLDS;

  switch (type) {
    case 'forwardHead':
      return Math.max(0, thresholds.forwardHead.normal - angle);
    case 'kneeHyperextension': {
      const { normalMin, normalMax } = thresholds.kneeHyperextension;
      if (angle < normalMin) {
        return normalMin - angle;
      }
      if (angle > normalMax) {
        return angle - normalMax;
      }
      return 0;
    }
    case 'roundedShoulder':
      return Math.max(0, Math.abs(angle) - thresholds.roundedShoulder.normal);
    case 'shoulderImbalance':
      return Math.max(0, Math.abs(angle) - thresholds.shoulderImbalance.normal);
    case 'pelvicTilt':
      return Math.max(0, Math.abs(angle) - thresholds.pelvicTilt.normal);
    case 'anteriorPelvicTilt':
      return Math.max(0, Math.abs(angle) - thresholds.anteriorPelvicTilt.normal);
    case 'kneeValgus':
      return Math.max(0, Math.abs(angle) - thresholds.kneeValgus.normal);
    case 'headOffset':
      return Math.max(0, Math.abs(angle) - thresholds.headOffset.normal);
    case 'centerOfGravityShift':
      return Math.max(0, Math.abs(angle) - thresholds.centerOfGravityShift.normal);
    case 'hunchback':
      return Math.max(0, Math.abs(angle) - thresholds.hunchback.normal);
  }
}

function getCenterDistanceWithinNormal(type: PostureIssueType, angle: number): number {
  const params = GAUSSIAN_PARAMS[type];

  switch (type) {
    case 'forwardHead':
      return 0;
    case 'kneeHyperextension':
      return Math.abs(angle - params.center);
    default:
      return Math.abs(angle - params.center);
  }
}

function getNormalBoundaryDistanceFromCenter(type: PostureIssueType, angle: number): number {
  const thresholds = DEFAULT_THRESHOLDS;
  const center = GAUSSIAN_PARAMS[type].center;

  switch (type) {
    case 'forwardHead':
      return 0;
    case 'kneeHyperextension': {
      const { normalMin, normalMax } = thresholds.kneeHyperextension;
      return angle < center ? center - normalMin : normalMax - center;
    }
    case 'roundedShoulder':
      return thresholds.roundedShoulder.normal;
    case 'shoulderImbalance':
      return thresholds.shoulderImbalance.normal;
    case 'pelvicTilt':
      return thresholds.pelvicTilt.normal;
    case 'anteriorPelvicTilt':
      return thresholds.anteriorPelvicTilt.normal;
    case 'kneeValgus':
      return thresholds.kneeValgus.normal;
    case 'headOffset':
      return thresholds.headOffset.normal;
    case 'centerOfGravityShift':
      return thresholds.centerOfGravityShift.normal;
    case 'hunchback':
      return thresholds.hunchback.normal;
  }
}

function getSevereBoundaryDistance(type: PostureIssueType): number {
  const thresholds = DEFAULT_THRESHOLDS;

  switch (type) {
    case 'forwardHead':
      return thresholds.forwardHead.normal - thresholds.forwardHead.moderate;
    case 'kneeHyperextension':
      return thresholds.kneeHyperextension.normalMin - thresholds.kneeHyperextension.moderate;
    case 'roundedShoulder':
      return thresholds.roundedShoulder.moderate - thresholds.roundedShoulder.normal;
    case 'shoulderImbalance':
      return thresholds.shoulderImbalance.moderate - thresholds.shoulderImbalance.normal;
    case 'pelvicTilt':
      return thresholds.pelvicTilt.moderate - thresholds.pelvicTilt.normal;
    case 'anteriorPelvicTilt':
      return thresholds.anteriorPelvicTilt.moderate - thresholds.anteriorPelvicTilt.normal;
    case 'kneeValgus':
      return thresholds.kneeValgus.moderate - thresholds.kneeValgus.normal;
    case 'headOffset':
      return thresholds.headOffset.moderate - thresholds.headOffset.normal;
    case 'centerOfGravityShift':
      return thresholds.centerOfGravityShift.moderate - thresholds.centerOfGravityShift.normal;
    case 'hunchback':
      return thresholds.hunchback.moderate - thresholds.hunchback.normal;
  }
}

function calculateThresholdAwareGaussianScore(type: PostureIssueType, angle: number, severity?: PostureSeverity): { deviation: number; score: number } {
  if (severity === 'normal') {
    const deviation = getCenterDistanceWithinNormal(type, angle);
    const normalBoundaryDistance = getNormalBoundaryDistanceFromCenter(type, angle);

    if (normalBoundaryDistance === 0 || deviation === 0) {
      return { deviation, score: 100 };
    }

    const sigma = sigmaForBoundaryScore(normalBoundaryDistance, 90);
    return {
      deviation,
      score: Math.max(90, gaussianScore(deviation, 0, sigma)),
    };
  }

  const deviation = getNormalBoundaryDistance(type, angle);

  if (severity === 'undetected') {
    return { deviation, score: 100 };
  }

  const severeBoundaryDistance = getSevereBoundaryDistance(type);
  if (deviation === 0 || severeBoundaryDistance === 0) {
    return { deviation, score: 90 };
  }

  const sigma = sigmaForBoundaryScore(severeBoundaryDistance, (55 / 90) * 100);
  return {
    deviation,
    score: gaussianScoreFromBase(deviation, sigma, 90),
  };
}

/**
 * 计算单个问题的分数（0-100）
 */
export function calculateIssueScore(
  issueOrType: PostureIssue | PostureIssueType,
  angle?: number
): PostureIssueScore {
  const type = typeof issueOrType === 'string' ? issueOrType : issueOrType.type;
  const rawAngle = typeof issueOrType === 'string' ? (angle ?? 0) : issueOrType.angle;
  const severity = typeof issueOrType === 'string' ? undefined : issueOrType.severity;
  const params = GAUSSIAN_PARAMS[type];
  const fallbackDeviation = Math.abs(rawAngle - params.center);
  const { deviation, score } = typeof issueOrType === 'string'
    ? { deviation: fallbackDeviation, score: gaussianScore(rawAngle, params.center, params.sigma) }
    : calculateThresholdAwareGaussianScore(type, rawAngle, severity);

  return {
    type,
    rawAngle,
    deviation,
    gaussianScore: score,
    view: getIssueView(type),
  };
}

/**
 * 按视图分组计算分数并归一化
 */
export function calculateNormalizedScores(issues: PostureIssue[]): {
  frontViewScore: ViewNormalizedScore;
  sideViewScore: ViewNormalizedScore;
} {
  const frontItems: PostureIssueScore[] = [];
  const sideItems: PostureIssueScore[] = [];

  for (const issue of issues) {
    if (issue.severity === 'undetected') {
      continue;
    }
    const itemScore = calculateIssueScore(issue);
    if (itemScore.view === 'front') {
      frontItems.push(itemScore);
    } else {
      sideItems.push(itemScore);
    }
  }

  const frontAvg = frontItems.length > 0
    ? frontItems.reduce((sum, item) => sum + item.gaussianScore, 0) / frontItems.length
    : 100; // 无检测项时按满分处理

  const sideAvg = sideItems.length > 0
    ? sideItems.reduce((sum, item) => sum + item.gaussianScore, 0) / sideItems.length
    : 100;

  return {
    frontViewScore: {
      view: 'front',
      items: frontItems,
      normalizedScore: frontAvg,
    },
    sideViewScore: {
      view: 'side',
      items: sideItems,
      normalizedScore: sideAvg,
    },
  };
}

/**
 * 使用高斯衰减 + 按视图归一化计算总分
 */
export function calculatePostureScoreWithNormalization(
  issues: PostureIssue[]
): { finalScore: number; frontViewScore: ViewNormalizedScore; sideViewScore: ViewNormalizedScore; allScores: PostureIssueScore[] } {
  const { frontViewScore, sideViewScore } = calculateNormalizedScores(issues);
  const allScores = [...frontViewScore.items, ...sideViewScore.items];

  const totalCount = frontViewScore.items.length + sideViewScore.items.length;

  if (totalCount === 0) {
    return {
      finalScore: 100,
      frontViewScore,
      sideViewScore,
      allScores,
    };
  }

  // 加权平均
  const frontWeighted = frontViewScore.normalizedScore * frontViewScore.items.length;
  const sideWeighted = sideViewScore.normalizedScore * sideViewScore.items.length;
  const finalScore = (frontWeighted + sideWeighted) / totalCount;

  return {
    finalScore,
    frontViewScore,
    sideViewScore,
    allScores,
  };
}

export function calculatePostureScore(issues: PostureIssue[]): number {
  return calculatePostureScoreWithNormalization(issues).finalScore;
}
