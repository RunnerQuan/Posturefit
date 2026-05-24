import { generateId } from '../../lib/ids';
import { getCurrentISOString } from '../../lib/time';
import type { CheckInFeedback, CoachClient, CoachFeedbackRequest, CoachMessage, CoachPlanRequest } from '../../types';

type CozeMode = 'plan' | 'feedback';

type CozePromptPayload = {
  forwardHeadAngle: number;
  roundedShoulderAngle: number;
  anteriorTiltAngle: number;
  coachStyle: string;
  coachGender: string;
  userGoal: string;
  bodyState: string;
  feedback: string;
  mode: CozeMode;
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
  return {
    endpoint: getRequiredEnv('VITE_COZE_ENDPOINT'),
    projectId: getRequiredEnv('VITE_COZE_PROJECT_ID'),
    token: getRequiredEnv('VITE_COZE_TOKEN'),
  };
}

function mapFeedback(feedback: CheckInFeedback): string {
  return feedback === 'completed' ? '做完了' : '太累了';
}

export function parseCozeStream(text: string): string {
  return text
    .split(/\r?\n/)
    .filter(line => line.startsWith('data:'))
    .map(line => line.replace(/^data:\s*/, '').trim())
    .filter(Boolean)
    .map(line => {
      try {
        const parsed = JSON.parse(line) as { content?: { answer?: string; error?: string | null } };
        if (parsed.content?.error) {
          throw new Error(parsed.content.error);
        }
        return parsed.content?.answer ?? '';
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
    this.fetcher = options.fetcher ?? fetch;
  }

  async generatePlanMessage(request: CoachPlanRequest): Promise<CoachMessage> {
    return this.runCoze({
      forwardHeadAngle: request.analysis.metrics.forwardHeadAngle,
      roundedShoulderAngle: request.analysis.metrics.roundedShoulderAngle,
      anteriorTiltAngle: request.analysis.metrics.anteriorTiltAngle,
      coachStyle: request.profile.coachStyle,
      coachGender: request.profile.coachGender,
      userGoal: request.profile.userGoal,
      bodyState: request.profile.bodyState,
      feedback: '',
      mode: 'plan',
    }, request.plan.sessionId);
  }

  async respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage> {
    return this.runCoze({
      forwardHeadAngle: 0,
      roundedShoulderAngle: 0,
      anteriorTiltAngle: 0,
      coachStyle: request.profile.coachStyle,
      coachGender: request.profile.coachGender,
      userGoal: request.profile.userGoal,
      bodyState: request.profile.bodyState,
      feedback: mapFeedback(request.feedback),
      mode: 'feedback',
    });
  }

  private async runCoze(payload: CozePromptPayload, sessionId?: string): Promise<CoachMessage> {
    const response = await this.fetcher(this.endpoint, {
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
    });

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
    };
  }
}
