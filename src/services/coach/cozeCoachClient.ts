import { generateId } from '../../lib/ids';
import { getCurrentISOString } from '../../lib/time';
import { COACH_NAME } from '../../data/demoProfiles';
import type {
  CheckInFeedback,
  CoachClient,
  CoachFeedbackRequest,
  CoachMessage,
  CoachPlanRequest,
  PostureAnalysisResult,
  PostureIssue,
  PostureIssueType,
  UserProfile,
} from '../../types';

type CozeMode = 'plan' | 'feedback';
type CozeIssueType =
  | 'forwardHead'
  | 'roundedShoulder'
  | 'anteriorTilt'
  | 'shoulderImbalance'
  | 'pelvicTilt'
  | 'kneeValgus'
  | 'headOffset'
  | 'centerOfGravityShift'
  | 'hunchback'
  | 'kneeHyperextension';

type CozePromptPayload = {
  score: number;
  primaryIssue: CozeIssueType | '';
  issues: Array<{
    type: CozeIssueType;
    severity: PostureIssue['severity'];
    angle: number;
    category: '正面' | '侧面';
  }>;
  coachStyle: string;
  coachGender: string;
  coachName: string;
  userGoal: string;
  bodyState: string;
  feedback: string;
  mode: CozeMode;
  captureMode: string;
  viewSelection: string;
  profile?: UserProfile;
  previousMessages?: Array<{
    role: string;
    content: string;
  }>;
  currentExerciseNames: string[];
  completedExerciseNames: string[];
  generatedExerciseNames: string[];
};

type CozeClientOptions = {
  endpoint: string;
  projectId?: string;
  token?: string;
  sessionId?: string;
  fetcher?: typeof fetch;
};

const DEFAULT_COZE_PROJECT_ID = '7643312041570172962';
const DEFAULT_COZE_PROXY_ENDPOINT = '/api/coze/stream_run';

function getRequiredEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`缺少 Coze 环境变量：${name}`);
  }
  return String(value);
}

function getDefaultOptions(): CozeClientOptions {
  const endpoint = String(import.meta.env.VITE_COZE_PROXY_ENDPOINT || DEFAULT_COZE_PROXY_ENDPOINT);
  return {
    endpoint,
    projectId: import.meta.env.DEV && import.meta.env.MODE !== 'test'
      ? String(import.meta.env.VITE_COZE_PROJECT_ID || DEFAULT_COZE_PROJECT_ID)
      : undefined,
    token: import.meta.env.DEV && import.meta.env.MODE !== 'test'
      ? getRequiredEnv('VITE_COZE_TOKEN')
      : undefined,
  };
}

function mapFeedback(feedback: CheckInFeedback | string, feedbackText?: string): string {
  return feedbackText?.trim() || feedback;
}

function assertValidTokenFormat(token: string): void {
  if (token.split('.').length !== 3) {
    throw new Error('Coze token 格式异常：请确认 VITE_COZE_TOKEN 只包含一个完整 token，不要拼接多个 token');
  }
}

const COZE_ISSUE_TYPES = new Set<CozeIssueType>([
  'forwardHead',
  'roundedShoulder',
  'anteriorTilt',
  'shoulderImbalance',
  'pelvicTilt',
  'kneeValgus',
  'headOffset',
  'centerOfGravityShift',
  'hunchback',
  'kneeHyperextension',
]);

function mapCozeIssueType(issue: PostureIssueType | null | undefined): CozeIssueType | null {
  if (!issue) {
    return null;
  }
  const mapped = issue === 'anteriorPelvicTilt' ? 'anteriorTilt' : issue;
  return COZE_ISSUE_TYPES.has(mapped as CozeIssueType) ? (mapped as CozeIssueType) : null;
}

function getCozeIssues(analysis?: PostureAnalysisResult): CozePromptPayload['issues'] {
  return analysis?.issues
    .flatMap(issue => {
      const type = mapCozeIssueType(issue.type);
      if (!type) {
        return [];
      }
      return [{
        type,
        severity: issue.severity,
        angle: issue.angle,
        category: issue.view === 'front' ? '正面' as const : '侧面' as const,
      }];
    }) ?? [];
}

function getCozePrimaryIssue(analysis: PostureAnalysisResult | undefined): CozeIssueType | '' {
  const primaryIssue = mapCozeIssueType(analysis?.primaryIssue);
  if (primaryIssue) {
    return primaryIssue;
  }
  const firstIssue = getCozeIssues(analysis).find(issue => issue.severity !== 'normal');
  return firstIssue?.type ?? '';
}

function buildPayloadBase(
  profile: UserProfile,
  analysis: PostureAnalysisResult | undefined,
  memory: Pick<CozePromptPayload, 'currentExerciseNames' | 'completedExerciseNames' | 'generatedExerciseNames'>,
  captureMode = 'fullBody',
  viewSelection = 'dual'
): Omit<CozePromptPayload, 'feedback' | 'mode'> {
  const primaryIssue = getCozePrimaryIssue(analysis);
  return {
    score: analysis?.score ?? 0,
    primaryIssue,
    issues: getCozeIssues(analysis),
    coachStyle: profile.coachStyle,
    coachGender: profile.coachGender,
    coachName: COACH_NAME,
    userGoal: profile.userGoal,
    bodyState: profile.bodyState,
    captureMode,
    viewSelection,
    profile,
    currentExerciseNames: memory.currentExerciseNames,
    completedExerciseNames: memory.completedExerciseNames,
    generatedExerciseNames: memory.generatedExerciseNames,
  };
}

function getRequestMemory(
  request: Pick<CoachPlanRequest | CoachFeedbackRequest, 'currentExerciseNames' | 'completedExerciseNames' | 'generatedExerciseNames'>
): Pick<CozePromptPayload, 'currentExerciseNames' | 'completedExerciseNames' | 'generatedExerciseNames'> {
  return {
    currentExerciseNames: request.currentExerciseNames ?? [],
    completedExerciseNames: request.completedExerciseNames ?? [],
    generatedExerciseNames: request.generatedExerciseNames ?? [],
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
  private readonly projectId?: string;
  private readonly token?: string;
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
      ...buildPayloadBase(
        request.profile,
        request.analysis,
        getRequestMemory(request),
        request.captureMode,
        request.viewSelection
      ),
      feedback: '',
      mode: 'plan',
    }, request.sessionId);
  }

  async generatePlanMessageStream(
    request: CoachPlanRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage> {
    return this.runCozeStream({
      ...buildPayloadBase(
        request.profile,
        request.analysis,
        getRequestMemory(request),
        request.captureMode,
        request.viewSelection
      ),
      feedback: '',
      mode: 'plan',
    }, request.sessionId, onDelta);
  }

  async respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage> {
    return this.runCoze({
      ...buildPayloadBase(
        request.profile,
        request.analysis,
        getRequestMemory(request),
        request.captureMode,
        request.viewSelection
      ),
      feedback: mapFeedback(request.feedback, request.feedbackText),
      mode: 'feedback',
      previousMessages: request.previousMessages.slice(-6).map(message => ({
        role: message.role,
        content: message.content,
      })),
    }, request.sessionId);
  }

  async respondToFeedbackStream(
    request: CoachFeedbackRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage> {
    return this.runCozeStream({
      ...buildPayloadBase(
        request.profile,
        request.analysis,
        getRequestMemory(request),
        request.captureMode,
        request.viewSelection
      ),
      feedback: mapFeedback(request.feedback, request.feedbackText),
      mode: 'feedback',
      previousMessages: request.previousMessages.slice(-6).map(message => ({
        role: message.role,
        content: message.content,
      })),
    }, request.sessionId, onDelta);
  }

  private createRequestInit(payload: CozePromptPayload, sessionId?: string): RequestInit {
    const resolvedSessionId = sessionId ?? this.sessionId ?? generateId();

    if (!this.token || !this.projectId) {
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload,
          sessionId: resolvedSessionId,
        }),
      };
    }

    assertValidTokenFormat(this.token);

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
        session_id: resolvedSessionId,
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
