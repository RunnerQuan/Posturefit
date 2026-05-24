import { ISSUE_LABELS, selectExercisesForIssue } from '../../data/exercises';
import { generateId } from '../../lib/ids';
import { getCurrentISOString } from '../../lib/time';
import type {
  BodyState,
  CombinedAnalysisResult,
  Exercise,
  PostureAnalysisResult,
  PostureIssueType,
  TrainingPlan,
} from '../../types';

type AnalysisLike = PostureAnalysisResult | CombinedAnalysisResult;

const FALLBACK_ISSUES: PostureIssueType[] = ['roundedShoulder', 'forwardHead', 'anteriorPelvicTilt'];

function getPrimaryIssue(analysis: AnalysisLike): PostureIssueType | null {
  return analysis.primaryIssue ?? null;
}

function halveDuration(exercise: Exercise): Exercise {
  return {
    ...exercise,
    durationSeconds: Math.max(20, Math.round(exercise.durationSeconds / 2)),
  };
}

export function generateTrainingPlan(
  sessionId: string,
  analysis: AnalysisLike,
  bodyState: BodyState
): TrainingPlan {
  const primaryIssue = getPrimaryIssue(analysis) ?? FALLBACK_ISSUES[0];
  const candidateIssues = [primaryIssue, ...FALLBACK_ISSUES.filter(issue => issue !== primaryIssue)];
  const selected: Exercise[] = [];
  const selectedIds = new Set<string>();

  for (const issue of candidateIssues) {
    const count = issue === primaryIssue ? 3 : 1;
    for (const exercise of selectExercisesForIssue(issue, bodyState, count)) {
      if (!selectedIds.has(exercise.id)) {
        selected.push(bodyState === 'fatigued' ? halveDuration(exercise) : exercise);
        selectedIds.add(exercise.id);
      }
      if (selected.length >= 3) {
        break;
      }
    }
    if (selected.length >= 3) {
      break;
    }
  }

  if (selected.length === 0) {
    for (const issue of FALLBACK_ISSUES) {
      for (const exercise of selectExercisesForIssue(issue, 'normal', 3)) {
        if (!selectedIds.has(exercise.id)) {
          selected.push(bodyState === 'fatigued' ? halveDuration(exercise) : exercise);
          selectedIds.add(exercise.id);
        }
        if (selected.length >= 3) {
          break;
        }
      }
      if (selected.length >= 3) {
        break;
      }
    }
  }

  return {
    id: generateId(),
    sessionId,
    primaryIssue,
    exercises: selected.slice(0, 3),
    createdAt: getCurrentISOString(),
    intensity: bodyState === 'fatigued' ? 'low' : 'medium',
  };
}

export function getTrainingPlanTitle(plan: TrainingPlan): string {
  return plan.primaryIssue ? `${ISSUE_LABELS[plan.primaryIssue]}改善计划` : '日常体态维护计划';
}
