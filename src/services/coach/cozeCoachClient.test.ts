import { describe, expect, it, vi } from 'vitest';
import { CozeCoachClient, parseCozeStream } from './cozeCoachClient';
import { ResilientCoachClient } from './resilientCoachClient';
import { mockCoachClient } from './mockCoachClient';
import type { CoachFeedbackRequest, CoachPlanRequest, PostureAnalysisResult, TrainingPlan, UserProfile } from '../../types';

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
      'data: {"type":"message_start","content":{"answer":null,"error":null},"finish":true}',
      'data: {"type":"answer","content":{"answer":"明天","error":null},"finish":false}',
      'data: {"type":"answer","content":{"answer":"继续","error":null},"finish":false}',
      'data: {"type":"answer","content":{"answer":"","error":null},"finish":true}',
      'data: {"type":"message_end","content":{"answer":null,"error":null},"finish":true}',
      '',
    ].join('\n'))).toBe('明天继续');
  });

  it('posts Coze prompt payload and returns a coach message', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('event: message\ndata: {"type":"message_start","content":{"answer":null,"error":null},"finish":true}\ndata: {"type":"answer","content":{"answer":"计划已生成","error":null},"finish":false}\ndata: {"type":"answer","content":{"answer":"","error":null},"finish":true}\ndata: {"type":"message_end","content":{"answer":null,"error":null},"finish":true}\n\n', { status: 200 })
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
    expect(prompt.shoulderImbalance).toBe(0);
    expect(prompt.primaryIssue).toBe('anteriorPelvicTilt');
    expect(prompt.plan.primaryIssue).toBe('anteriorPelvicTilt');
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer test-token',
    });
  });

  it('posts custom check-in feedback text to Coze', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('event: message\ndata: {"type":"message_start","content":{"answer":null,"error":null},"finish":true}\ndata: {"type":"answer","content":{"answer":"今天先减量","error":null},"finish":false}\ndata: {"type":"answer","content":{"answer":"","error":null},"finish":true}\ndata: {"type":"message_end","content":{"answer":null,"error":null},"finish":true}\n\n', { status: 200 })
    );
    const client = new CozeCoachClient({
      endpoint: 'https://example.test/stream_run',
      projectId: '7643064613231263754',
      token: 'test-token',
      fetcher,
    });
    const feedbackRequest: CoachFeedbackRequest = {
      analysis,
      profile,
      plan,
      feedback: 'tooTired',
      feedbackText: '太累了，腰酸',
      previousMessages: [
        { id: 'm-1', role: 'assistant', content: '开始训练', createdAt: '2026-05-24T00:00:00.000Z' },
        { id: 'm-2', role: 'user', content: '太累了，腰酸', createdAt: '2026-05-24T00:01:00.000Z' },
      ],
    };

    const message = await client.respondToFeedback(feedbackRequest);
    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    const prompt = JSON.parse(body.content.query.prompt[0].content.text);

    expect(message.content).toBe('今天先减量');
    expect(prompt.mode).toBe('feedback');
    expect(prompt.feedback).toBe('太累了，腰酸');
    expect(prompt.forwardHeadAngle).toBe(6);
    expect(prompt.previousMessages).toHaveLength(2);
    expect(body.session_id).toBe('session-1');
  });

  it('streams check-in feedback chunks', async () => {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('event: message\n'));
        controller.enqueue(encoder.encode('data: {"type":"message_start","content":{"answer":null,"error":null},"finish":true}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"answer","content":{"answer":"先减","error":null},"finish":false}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"answer","content":{"answer":"量一点","error":null},"finish":false}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"answer","content":{"answer":"","error":null},"finish":true}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"message_end","content":{"answer":null,"error":null},"finish":true}\n\n'));
        controller.close();
      },
    });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(stream, { status: 200 }));
    const client = new CozeCoachClient({
      endpoint: 'https://example.test/stream_run',
      projectId: '7643064613231263754',
      token: 'test-token',
      fetcher,
    });
    const deltas: string[] = [];

    const message = await client.respondToFeedbackStream!(
      {
        analysis,
        profile,
        plan,
        feedback: 'tooTired',
        feedbackText: '太累了',
        previousMessages: [],
      },
      delta => deltas.push(delta)
    );

    expect(deltas).toEqual(['先减', '量一点']);
    expect(message.content).toBe('先减量一点');
  });

  it('streams fallback mock when Coze fails before output', async () => {
    const primary = {
      generatePlanMessage: vi.fn(),
      respondToFeedback: vi.fn(),
      respondToFeedbackStream: vi.fn().mockRejectedValue(new Error('cors')),
    };
    const client = new ResilientCoachClient(primary, mockCoachClient);

    const message = await client.respondToFeedbackStream!(
      {
        profile,
        plan,
        feedback: 'completed',
        previousMessages: [],
      },
      vi.fn()
    );

    expect(message.content).toContain('已完成');
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
