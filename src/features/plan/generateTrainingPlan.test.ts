import { describe, expect, it } from 'vitest';
import { generateTrainingPlan } from './generateTrainingPlan';
import type { CombinedAnalysisResult } from '../../types';

const analysis: CombinedAnalysisResult = {
  primaryIssue: 'roundedShoulder',
  score: 76,
  analyzedAt: '2026-05-24T00:00:00.000Z',
  allIssues: [],
  issuesByView: {
    front: [],
    side: [],
  },
};

describe('generateTrainingPlan', () => {
  it('selects three exercises for the primary issue', () => {
    const plan = generateTrainingPlan('session-1', analysis, 'normal');

    expect(plan.primaryIssue).toBe('roundedShoulder');
    expect(plan.exercises).toHaveLength(3);
    expect(plan.exercises.every(exercise => exercise.bilibiliSearchUrl.includes('bilibili'))).toBe(true);
  });

  it('filters contraindicated exercises by body state', () => {
    const plan = generateTrainingPlan('session-1', analysis, 'postpartum');

    expect(plan.exercises.some(exercise => exercise.name === '菱形肌强化')).toBe(false);
    expect(plan.exercises.every(exercise => !exercise.contraindications?.includes('postpartum'))).toBe(true);
  });

  it('reduces duration for fatigued users', () => {
    const normal = generateTrainingPlan('session-1', analysis, 'normal');
    const fatigued = generateTrainingPlan('session-1', analysis, 'fatigued');

    expect(fatigued.intensity).toBe('low');
    expect(fatigued.exercises[0].durationSeconds).toBeLessThan(normal.exercises[0].durationSeconds);
  });
});
