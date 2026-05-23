import type { PostureAnalysisResult } from '../../types';
import { calculateAllPostureAngles } from './angleCalculator';
import { classifyAllPostureIssues, findPrimaryIssue, calculatePostureScore } from './postureClassifier';
import { getCurrentISOString } from '../../lib/time';

export interface AnalyzePoseOptions {
  minScore?: number;
}

export function analyzePose(keypoints: PostureAnalysisResult['keypoints']): PostureAnalysisResult {
  const metrics = calculateAllPostureAngles(keypoints);
  const issues = classifyAllPostureIssues(metrics);
  const primaryIssue = findPrimaryIssue(issues);
  const score = calculatePostureScore(issues);

  return {
    keypoints,
    metrics,
    issues,
    primaryIssue,
    score,
    analyzedAt: getCurrentISOString(),
  };
}

export function createEmptyAnalysisResult(): PostureAnalysisResult {
  return {
    keypoints: [],
    metrics: {
      forwardHeadAngle: 0,
      roundedShoulderAngle: 0,
      anteriorTiltAngle: 0,
    },
    issues: [],
    primaryIssue: null,
    analyzedAt: getCurrentISOString(),
  };
}

export function isAnalysisValid(result: PostureAnalysisResult): boolean {
  return (
    result.keypoints.length === 17 &&
    result.issues.length === 3 &&
    result.analyzedAt !== ''
  );
}
