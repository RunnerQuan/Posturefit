import { generateId } from '../../lib/ids';
import { getCurrentISOString } from '../../lib/time';
import type {
  CheckInFeedback,
  CoachClient,
  CoachFeedbackRequest,
  CoachMessage,
  CoachPlanRequest,
  Exercise,
  PostureAngleMetrics,
  PostureAnalysisResult,
  TrainingPlan,
  UserProfile,
} from '../../types';

type CozeMode = 'plan' | 'feedback';

type CozePromptPayload = {
  forwardHeadAngle: number;
  roundedShoulderAngle: number;
  anteriorTiltAngle: number;
  shoulderImbalance: number;
  pelvicTilt: number;
  kneeValgus: number;
  headOffset: number;
  centerOfGravityShift: number;
  hunchback: number;
  kneeHyperextension: number;
  score: number;
  primaryIssue: string;
  issues: Array<{
    type: string;
    severity: string;
    angle: number;
  }>;
  coachStyle: string;
  coachGender: string;
  userGoal: string;
  bodyState: string;
  feedback: string;
  mode: CozeMode;
  plan: {
    primaryIssue: string | null;
    exercises: Array<{
      id: string;
      name: string;
      durationSeconds: number;
      description: string;
      bilibiliSearchUrl: string;
    }>;
  };
  profile: UserProfile;
  previousMessages?: Array<{
    role: string;
    content: string;
  }>;
};

type CozeClientOptions = {
  endpoint: string;
  projectId: string;
  token: string;
  sessionId?: string;
  fetcher?: typeof fetch;
};

function getRequiredEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`缺少 Coze 环境变量：${name}`);
  }
  return String(value);
}

function getDefaultOptions(): CozeClientOptions {
  const endpoint = getRequiredEnv('VITE_COZE_ENDPOINT');
  return {
    endpoint: import.meta.env.DEV && import.meta.env.MODE !== 'test' && endpoint.includes('coze.site')
      ? '/api/coze/stream_run'
      : endpoint,
    projectId: getRequiredEnv('VITE_COZE_PROJECT_ID'),
    token: getRequiredEnv('VITE_COZE_TOKEN'),
  };
}

function mapFeedback(feedback: CheckInFeedback): string {
  return feedback === 'completed' ? '做完了' : '太累了';
}

const EMPTY_METRICS: PostureAngleMetrics = {
  forwardHeadAngle: 0,
  roundedShoulderAngle: 0,
  anteriorTiltAngle: 0,
  shoulderImbalance: 0,
  pelvicTilt: 0,
  kneeValgus: 0,
  headOffset: 0,
  centerOfGravityShift: 0,
  hunchback: 0,
  kneeHyperextension: 0,
};

function normalizePlan(plan: TrainingPlan): CozePromptPayload['plan'] {
  return {
    primaryIssue: plan.primaryIssue,
    exercises: plan.exercises.map((exercise: Exercise) => ({
      id: exercise.id,
      name: exercise.name,
      durationSeconds: exercise.durationSeconds,
      description: exercise.description,
      bilibiliSearchUrl: exercise.bilibiliSearchUrl,
    })),
  };
}

function buildPayloadBase(
  profile: UserProfile,
  plan: TrainingPlan,
  analysis?: PostureAnalysisResult
): Omit<CozePromptPayload, 'feedback' | 'mode'> {
  const metrics = analysis?.metrics ?? EMPTY_METRICS;
  return {
    ...metrics,
    score: analysis?.score ?? 0,
    primaryIssue: analysis?.primaryIssue ?? plan.primaryIssue ?? '',
    issues: analysis?.issues.map(issue => ({
      type: issue.type,
      severity: issue.severity,
      angle: issue.angle,
    })) ?? [],
    coachStyle: profile.coachStyle,
    coachGender: profile.coachGender,
    userGoal: profile.userGoal,
    bodyState: profile.bodyState,
    plan: normalizePlan(plan),
    profile,
  };
}

/**
 * Coze stream_run SSE 真实响应格式（通过实际 API 测试确认）
 *
 * 每条 SSE 消息格式：
 *   event: message
 *   data: {"type":"answer","content":{"answer":"根据"},"finish":false,...}
 *
 * type 有三种：
 *   - "message_start"：消息开始，content.answer 为 null
 *   - "answer"：正文片段，content.answer 为文本 chunk
 *   - "message_end"：消息结束，content.answer 为 null
 */
type CozeStreamChunk = {
  type: 'message_start' | 'answer' | 'message_end';
  content: {
    answer: string | null;
    error: string | null;
  };
  finish: boolean;
};

function extractCozeAnswer(chunk: CozeStreamChunk): string {
  if (chunk.content.error) {
    throw new Error(`Coze 错误: ${chunk.content.error}`);
  }
  if (chunk.type === 'answer' && chunk.content.answer != null) {
    return chunk.content.answer;
  }
  return '';
}

export function parseCozeStream(text: string): string {
  return text
    .split(/\r?\n/)
    .filter(line => line.startsWith('data:'))
    .map(line => line.replace(/^data:\s*/, '').trim())
    .filter(Boolean)
    .map(line => {
      try {
        const chunk = JSON.parse(line) as CozeStreamChunk;
        return extractCozeAnswer(chunk);
      } catch (error) {
        if (error instanceof Error && !line.startsWith('{')) {
          return '';
        }
        throw error;
      }
    })
    .join('')
    .trim();
}

export function parseCozeDataLine(line: string): string {
  const data = line.replace(/^data:\s*/, '').trim();
  if (!data || data === '[DONE]') {
    return '';
  }
  const chunk = JSON.parse(data) as CozeStreamChunk;
  return extractCozeAnswer(chunk);
}

export class CozeCoachClient implements CoachClient {
  private readonly endpoint: string;
  private readonly projectId: string;
  private readonly token: string;
  private readonly sessionId?: string;
  private readonly fetcher: typeof fetch;

  constructor(options: CozeClientOptions = getDefaultOptions()) {
    this.endpoint = options.endpoint;
    this.projectId = options.projectId;
    this.token = options.token;
    this.sessionId = options.sessionId;
    // bind(window) 防止 "Illegal invocation"：全局 fetch 脱离 window 上下文后 this 丢失
    this.fetcher = options.fetcher ?? fetch.bind(window);
  }

  async generatePlanMessage(request: CoachPlanRequest): Promise<CoachMessage> {
    return this.runCoze({
      ...buildPayloadBase(request.profile, request.plan, request.analysis),
      feedback: '',
      mode: 'plan',
    }, request.plan.sessionId);
  }

  async respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage> {
    return this.runCoze({
      ...buildPayloadBase(request.profile, request.plan, request.analysis),
      feedback: request.feedbackText?.trim() || mapFeedback(request.feedback),
      mode: 'feedback',
      previousMessages: request.previousMessages.slice(-6).map(message => ({
        role: message.role,
        content: message.content,
      })),
    }, request.plan.sessionId);
  }

  async respondToFeedbackStream(
    request: CoachFeedbackRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage> {
    return this.runCozeStream({
      ...buildPayloadBase(request.profile, request.plan, request.analysis),
      feedback: request.feedbackText?.trim() || mapFeedback(request.feedback),
      mode: 'feedback',
      previousMessages: request.previousMessages.slice(-6).map(message => ({
        role: message.role,
        content: message.content,
      })),
    }, request.plan.sessionId, onDelta);
  }

  private createRequestInit(payload: CozePromptPayload, sessionId?: string): RequestInit {
    return {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [
              {
                type: 'text',
                content: {
                  text: JSON.stringify(payload),
                },
              },
            ],
          },
        },
        type: 'query',
        session_id: sessionId ?? this.sessionId ?? generateId(),
        project_id: Number(this.projectId),
      }),
    };
  }

  private async runCoze(payload: CozePromptPayload, sessionId?: string): Promise<CoachMessage> {
    const response = await this.fetcher(this.endpoint, this.createRequestInit(payload, sessionId));

    if (!response.ok) {
      throw new Error(`Coze 请求失败：${response.status}`);
    }

    const content = parseCozeStream(await response.text());
    if (!content) {
      throw new Error('Coze 返回内容为空');
    }

    return {
      id: generateId(),
      role: 'assistant',
      content,
      createdAt: getCurrentISOString(),
      source: 'coze',
    };
  }

  private async runCozeStream(
    payload: CozePromptPayload,
    sessionId: string | undefined,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage> {
    const response = await this.fetcher(this.endpoint, this.createRequestInit(payload, sessionId));
    if (!response.ok) {
      throw new Error(`Coze 请求失败：${response.status}`);
    }

    if (!response.body) {
      return this.runCoze(payload, sessionId);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';

    const flushLine = (line: string) => {
      if (!line.startsWith('data:')) {
        return;
      }
      const delta = parseCozeDataLine(line);
      if (delta) {
        content += delta;
        onDelta(delta);
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      lines.forEach(flushLine);
    }

    buffer += decoder.decode();
    buffer.split(/\r?\n/).forEach(flushLine);

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error('Coze 返回内容为空');
    }

    return {
      id: generateId(),
      role: 'assistant',
      content: trimmedContent,
      createdAt: getCurrentISOString(),
      source: 'coze',
    };
  }
}
