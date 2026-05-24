import type { PostureAnalysisResult, CombinedAnalysisResult, PoseView, PostureIssue, CaptureMode } from '../../types';
import { calculateAllPostureAngles, calculateFrontViewMetrics, calculateSideViewMetrics } from './angleCalculator';
import { classifyAllPostureIssues, findPrimaryIssue, calculatePostureScore } from './postureClassifier';
import { getCurrentISOString } from '../../lib/time';

export interface AnalyzePoseOptions {
  minScore?: number;
  view?: PoseView;
  captureMode?: CaptureMode;
}

/**
 * 分析单张照片的体态
 * @param keypoints 关键点数据
 * @param options 分析选项，包含视角和拍摄模式
 */
export function analyzePose(
  keypoints: PostureAnalysisResult['keypoints'],
  options: AnalyzePoseOptions = {}
): PostureAnalysisResult {
  const { view = 'front', captureMode } = options;

  // 根据视角计算对应指标
  let metrics;
  if (view === 'front') {
    metrics = {
      ...calculateAllPostureAngles(keypoints),
      ...calculateFrontViewMetrics(keypoints),
    };
  } else if (view === 'side') {
    metrics = {
      ...calculateAllPostureAngles(keypoints),
      ...calculateSideViewMetrics(keypoints),
    };
  } else {
    metrics = calculateAllPostureAngles(keypoints);
  }

  // 根据视角和拍摄模式筛选可分析的问题
  const issues = classifyAllPostureIssues(metrics, undefined, view, captureMode);
  const primaryIssue = findPrimaryIssue(issues);
  const score = calculatePostureScore(issues);

  return {
    keypoints,
    metrics,
    issues,
    primaryIssue,
    score,
    analyzedAt: getCurrentISOString(),
    view,
  };
}

/**
 * 合并正面和侧面的分析结果
 */
export function combineAnalyses(
  frontAnalysis: PostureAnalysisResult | null,
  sideAnalysis: PostureAnalysisResult | null
): CombinedAnalysisResult {
  const allIssues: PostureIssue[] = [];
  const issuesByView: Record<PoseView, PostureIssue[]> = {
    front: [],
    side: [],
  };

  // 收集正面问题
  if (frontAnalysis) {
    issuesByView.front = [...frontAnalysis.issues];
    allIssues.push(...frontAnalysis.issues);
  }

  // 收集侧面问题
  if (sideAnalysis) {
    issuesByView.side = [...sideAnalysis.issues];
    allIssues.push(...sideAnalysis.issues);
  }

  // 按严重程度排序
  const severityOrder: Record<string, number> = {
    normal: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
  };

  allIssues.sort((a, b) => {
    const orderA = severityOrder[a.severity] ?? 0;
    const orderB = severityOrder[b.severity] ?? 0;
    return orderB - orderA;
  });

  // 选择主要问题（最严重的非正常问题）
  const primaryIssue = findPrimaryIssue(allIssues);

  // 计算综合评分
  const score = calculatePostureScore(allIssues);

  return {
    allIssues,
    issuesByView,
    primaryIssue,
    score,
    analyzedAt: getCurrentISOString(),
  };
}

export function createEmptyAnalysisResult(view: PoseView = 'front'): PostureAnalysisResult {
  return {
    keypoints: [],
    metrics: {
      forwardHeadAngle: 0,
      roundedShoulderAngle: 0,
      shoulderImbalanceAngle: 0,
      pelvicTiltAngle: 0,
      anteriorTiltAngle: 0,
      kneeValgusAngle: 0,
      headOffsetAngle: 0,
      centerOfGravityShiftAngle: 0,
      hunchbackAngle: 0,
      kneeHyperextensionAngle: 180,
      trunkLeanAngle: 0,
    },
    issues: [],
    primaryIssue: null,
    analyzedAt: getCurrentISOString(),
    view,
  };
}

export function isAnalysisValid(result: PostureAnalysisResult): boolean {
  return (
    result.keypoints.length >= 17 &&
    result.issues.length > 0 &&
    result.analyzedAt !== ''
  );
}

/**
 * 检查双视角拍摄是否完成
 */
export function isDualCaptureComplete(
  frontAnalysis: PostureAnalysisResult | null,
  sideAnalysis: PostureAnalysisResult | null,
  viewSelection: 'front' | 'side' | 'dual'
): boolean {
  if (viewSelection === 'front') {
    return frontAnalysis !== null;
  }
  if (viewSelection === 'side') {
    return sideAnalysis !== null;
  }
  // dual 模式需要两张都完成
  return frontAnalysis !== null && sideAnalysis !== null;
}
