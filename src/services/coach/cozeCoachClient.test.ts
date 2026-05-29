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
    shoulderImbalanceAngle: 0,
    pelvicTiltAngle: 0,
    anteriorTiltAngle: 25,
    kneeValgusAngle: 0,
    headOffsetAngle: 0,
    centerOfGravityShiftAngle: 0,
    hunchbackAngle: 0,
    kneeHyperextensionAngle: 0,
  },
  issues: [
    {
      type: 'anteriorPelvicTilt',
      severity: 'moderate',
      angle: 25,
      threshold: 15,
      label: '骨盆前倾中度异常',
      view: 'side',
    },
    {
      type: 'roundedShoulder',
      severity: 'mild',
      angle: 22,
      threshold: 20,
      label: '圆肩轻度异常',
      view: 'side',
    },
  ],
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
  exercises: [
    {
      id: 'ap-1',
      issueType: 'anteriorPelvicTilt',
      name: '骨盆后倾训练',
      description: '旧规约动作',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=骨盆后倾训练',
    },
    {
      id: 'rs-3',
      issueType: 'roundedShoulder',
      name: '肩胛骨后缩',
      description: '坐直或站直，将双肩向后夹紧肩胛骨',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=肩胛骨后缩',
    },
  ],
  createdAt: '2026-05-24T00:00:00.000Z',
  intensity: 'medium',
};

const request: CoachPlanRequest = {
  analysis,
  profile,
  sessionId: 'session-1',
  captureMode: 'halfBody',
  viewSelection: 'side',
  currentExerciseNames: [],
  completedExerciseNames: [],
  generatedExerciseNames: [],
};

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
      projectId: '7643312041570172962',
      token: 'header.payload.signature',
      fetcher,
    });

    const message = await client.generatePlanMessage(request);
    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    const prompt = JSON.parse(body.content.query.prompt[0].content.text);

    expect(message.content).toBe('计划已生成');
    expect(prompt.mode).toBe('plan');
    expect(prompt.anteriorTiltAngle).toBeUndefined();
    expect(prompt.shoulderImbalance).toBeUndefined();
    expect(prompt.primaryIssue).toBe('anteriorTilt');
    expect(prompt.score).toBe(80);
    expect(prompt.coachName).toBe('爱可');
    expect(prompt.captureMode).toBe('halfBody');
    expect(prompt.viewSelection).toBe('side');
    expect(prompt.issues).toEqual([
      { type: 'anteriorTilt', severity: 'moderate', angle: 25, category: '侧面' },
      { type: 'roundedShoulder', severity: 'mild', angle: 22, category: '侧面' },
    ]);
    expect(prompt.currentExerciseNames).toEqual([]);
    expect(prompt.completedExerciseNames).toEqual([]);
    expect(prompt.generatedExerciseNames).toEqual([]);
    expect(body.session_id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(body.session_id).not.toBe('session-1');
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer header.payload.signature',
    });
  });

  it('posts custom check-in feedback text to Coze', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('event: message\ndata: {"type":"message_start","content":{"answer":null,"error":null},"finish":true}\ndata: {"type":"answer","content":{"answer":"今天先减量","error":null},"finish":false}\ndata: {"type":"answer","content":{"answer":"","error":null},"finish":true}\ndata: {"type":"message_end","content":{"answer":null,"error":null},"finish":true}\n\n', { status: 200 })
    );
    const client = new CozeCoachClient({
      endpoint: 'https://example.test/stream_run',
      projectId: '7643312041570172962',
      token: 'header.payload.signature',
      fetcher,
    });
    const feedbackRequest: CoachFeedbackRequest = {
      analysis,
      profile,
      sessionId: 'session-1',
      plan,
      feedback: 'tooTired',
      feedbackText: '太累了，腰酸',
      captureMode: 'fullBody',
      viewSelection: 'dual',
      currentExerciseNames: ['肩胛骨后缩', '胸椎伸展'],
      completedExerciseNames: ['墙壁天使'],
      generatedExerciseNames: ['肩胛骨后缩', '胸椎伸展', '墙壁天使'],
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
    expect(prompt.forwardHeadAngle).toBeUndefined();
    expect(prompt.currentExerciseNames).toEqual(['肩胛骨后缩', '胸椎伸展']);
    expect(prompt.completedExerciseNames).toEqual(['墙壁天使']);
    expect(prompt.generatedExerciseNames).toEqual(['肩胛骨后缩', '胸椎伸展', '墙壁天使']);
    expect(prompt.previousMessages).toHaveLength(2);
    expect(body.session_id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(body.session_id).not.toBe('session-1');
  });

  it('posts proxy payload without frontend token when using same-origin api route', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('event: message\ndata: {"type":"message_start","content":{"answer":null,"error":null},"finish":true}\ndata: {"type":"answer","content":{"answer":"代理正常","error":null},"finish":false}\ndata: {"type":"answer","content":{"answer":"","error":null},"finish":true}\ndata: {"type":"message_end","content":{"answer":null,"error":null},"finish":true}\n\n', { status: 200 })
    );
    const client = new CozeCoachClient({
      endpoint: '/api/coze/stream_run',
      fetcher,
    });

    const message = await client.generatePlanMessage(request);
    const init = fetcher.mock.calls[0][1];
    const body = JSON.parse(String(init?.body));

    expect(message.content).toBe('代理正常');
    expect(init?.headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(body).toMatchObject({
      payload: {
        mode: 'plan',
        primaryIssue: 'anteriorTilt',
      },
    });
    expect(body.sessionId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(body.sessionId).not.toBe('session-1');
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
      projectId: '7643312041570172962',
      token: 'header.payload.signature',
      fetcher,
    });
    const deltas: string[] = [];

    const message = await client.respondToFeedbackStream!(
      {
        analysis,
        profile,
        sessionId: 'session-1',
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
        sessionId: 'session-1',
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
