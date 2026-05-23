import type { CaptureMode, PostureAnalysisResult, PostureIssueType } from '../../types';
import { calculateAllPostureAngles } from './angleCalculator';
import { classifyAllPostureIssues, findPrimaryIssue, calculatePostureScore } from './postureClassifier';
import { getCurrentISOString } from '../../lib/time';

export interface AnalyzePoseOptions {
  captureMode?: CaptureMode;
  minScore?: number;
}

const SUPPORTED_ISSUES_BY_MODE: Record<CaptureMode, PostureIssueType[]> = {
  fullBody: ['forwardHead', 'roundedShoulder', 'anteriorPelvicTilt'],
  halfBody: ['forwardHead', 'roundedShoulder'],
  closeUp: ['forwardHead'],
  sitting: ['forwardHead', 'roundedShoulder'],
};

export function analyzePose(
  keypoints: PostureAnalysisResult['keypoints'],
  options: AnalyzePoseOptions = {}
): PostureAnalysisResult {
  const captureMode = options.captureMode ?? 'fullBody';
  const supportedIssueTypes = SUPPORTED_ISSUES_BY_MODE[captureMode];
  const metrics = calculateAllPostureAngles(keypoints);
  const issues = classifyAllPostureIssues(metrics).filter(issue => supportedIssueTypes.includes(issue.type));
  const primaryIssue = findPrimaryIssue(issues);
  const score = calculatePostureScore(issues);

  return {
    captureMode,
    keypoints,
    metrics,
    issues,
    supportedIssueTypes,
    primaryIssue,
    score,
    analyzedAt: getCurrentISOString(),
  };
}

export function createEmptyAnalysisResult(): PostureAnalysisResult {
  return {
    captureMode: 'fullBody',
    keypoints: [],
    metrics: {
      forwardHeadAngle: 0,
      roundedShoulderAngle: 0,
      anteriorTiltAngle: 0,
    },
    issues: [],
    supportedIssueTypes: [],
    primaryIssue: null,
    analyzedAt: getCurrentISOString(),
  };
}

export function isAnalysisValid(result: PostureAnalysisResult): boolean {
  return (
    result.keypoints.length === 17 &&
    result.issues.length === result.supportedIssueTypes.length &&
    result.analyzedAt !== ''
  );
}
