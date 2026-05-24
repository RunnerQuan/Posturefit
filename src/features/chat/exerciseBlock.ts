import { generateId } from '../../lib/ids';
import { getCurrentISOString } from '../../lib/time';
import type { Exercise, PostureIssueType, TrainingPlan } from '../../types';

const EXERCISE_BLOCK_RE = /<!--\s*posturefit:exercises\s*([\s\S]*?)-->/i;
const EXERCISE_BLOCK_OPEN_RE = /<!--\s*posturefit:exercises[\s\S]*$/i;

type RawExercise = {
  id?: string;
  issueType?: PostureIssueType;
  name?: string;
  description?: string;
  durationSeconds?: number;
  duration?: number | string;
  bilibiliSearchUrl?: string;
  videoUrl?: string;
  url?: string;
};

type RawExerciseBlock = RawExercise[] | {
  exercises?: RawExercise[];
};

export function stripExerciseBlock(content: string): string {
  return content.replace(EXERCISE_BLOCK_RE, '').replace(EXERCISE_BLOCK_OPEN_RE, '').trim();
}

function normalizeDuration(raw: RawExercise): number {
  if (typeof raw.durationSeconds === 'number' && Number.isFinite(raw.durationSeconds)) {
    return raw.durationSeconds;
  }
  if (typeof raw.duration === 'number' && Number.isFinite(raw.duration)) {
    return raw.duration;
  }
  if (typeof raw.duration === 'string') {
    const match = raw.duration.match(/\d+/);
    if (match) {
      return Number(match[0]);
    }
  }
  return 60;
}

function normalizeExercise(raw: RawExercise, index: number, primaryIssue: PostureIssueType | null): Exercise | null {
  const name = raw.name?.trim();
  if (!name) {
    return null;
  }

  return {
    id: raw.id?.trim() || `coze-exercise-${index + 1}-${name}`,
    issueType: raw.issueType ?? primaryIssue ?? 'roundedShoulder',
    name,
    description: raw.description?.trim() || '跟随 AI 教练提示完成动作，过程中保持呼吸平稳。',
    durationSeconds: normalizeDuration(raw),
    bilibiliSearchUrl: raw.bilibiliSearchUrl || raw.videoUrl || raw.url || `https://search.bilibili.com/all?keyword=${encodeURIComponent(name)}`,
  };
}

export function extractExercisesFromMessage(
  content: string,
  primaryIssue: PostureIssueType | null = null
): Exercise[] {
  const match = content.match(EXERCISE_BLOCK_RE);
  if (!match?.[1]) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[1].trim()) as RawExerciseBlock;
    const rawExercises = Array.isArray(parsed) ? parsed : parsed.exercises ?? [];
    return rawExercises
      .slice(0, 3)
      .map((exercise, index) => normalizeExercise(exercise, index, primaryIssue))
      .filter((exercise): exercise is Exercise => Boolean(exercise));
  } catch {
    return [];
  }
}

export function extractTrainingPlanFromMessage(
  content: string,
  sessionId: string,
  primaryIssue: PostureIssueType | null
): TrainingPlan | null {
  const exercises = extractExercisesFromMessage(content, primaryIssue);
  if (exercises.length === 0) {
    return null;
  }

  return {
    id: `plan-${generateId()}`,
    sessionId,
    primaryIssue,
    exercises,
    createdAt: getCurrentISOString(),
    intensity: 'medium',
  };
}
