import { describe, expect, it, vi } from 'vitest';
import { CozeCoachClient, parseCozeStream } from './cozeCoachClient';
import { ResilientCoachClient } from './resilientCoachClient';
import { mockCoachClient } from './mockCoachClient';
import type { CoachPlanRequest, PostureAnalysisResult, TrainingPlan, UserProfile } from '../../types';

const analysis: PostureAnalysisResult = {
  keypoints: [],
  metrics: {
    forwardHeadAngle: 6,
    roundedShoulderAngle: 22,
    anteriorTiltAngle: 25,
    shoulderImbalance: 0,
    pelvicTilt: 0,
    kneeValgus: 0,
    headOffset: 0,
    centerOfGravityShift: 0,
    hunchback: 0,
    kneeHyperextension: 0,
  },
  issues: [],
  primaryIssue: 'anteriorPelvicTilt',
  score: 80,
  analyzedAt: '2026-05-24T00:00:00.000Z',
  view: 'side',
};

const profile: UserProfile = {
  coachStyle: 'strict',
  coachGender: 'male',
  userGoal: '产后骨盆恢复',
  bodyState: 'postpartum',
};

const plan: TrainingPlan = {
  id: 'plan-1',
  sessionId: 'session-1',
  primaryIssue: 'anteriorPelvicTilt',
  exercises: [],
  createdAt: '2026-05-24T00:00:00.000Z',
  intensity: 'medium',
};

const request: CoachPlanRequest = { analysis, profile, plan };

describe('CozeCoachClient', () => {
  it('parses streamed answer chunks', () => {
    expect(parseCozeStream([
      'event: message',
      'data: {"content":{"answer":"明天","error":null}}',
      'data: {"content":{"answer":"继续","error":null}}',
      '',
    ].join('\n'))).toBe('明天继续');
  });

  it('posts Coze prompt payload and returns a coach message', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('data: {"content":{"answer":"计划已生成","error":null}}', { status: 200 })
    );
    const client = new CozeCoachClient({
      endpoint: 'https://example.test/stream_run',
      projectId: '7643064613231263754',
      token: 'test-token',
      fetcher,
    });

    const message = await client.generatePlanMessage(request);
    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    const prompt = JSON.parse(body.content.query.prompt[0].content.text);

    expect(message.content).toBe('计划已生成');
    expect(prompt.mode).toBe('plan');
    expect(prompt.anteriorTiltAngle).toBe(25);
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer test-token',
    });
  });

  it('falls back to mock when primary client fails', async () => {
    const primary = {
      generatePlanMessage: vi.fn().mockRejectedValue(new Error('network')),
      respondToFeedback: vi.fn(),
    };
    const client = new ResilientCoachClient(primary, mockCoachClient);

    const message = await client.generatePlanMessage(request);

    expect(message.role).toBe('assistant');
    expect(message.content).toContain('今日训练计划');
  });
});
