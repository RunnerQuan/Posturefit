import type { CoachClient, CoachFeedbackRequest, CoachMessage, CoachPlanRequest } from '../../types';
import { CozeCoachClient } from './cozeCoachClient';
import { mockCoachClient } from './mockCoachClient';

function getFallbackReason(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

export class ResilientCoachClient implements CoachClient {
  constructor(
    private readonly primary: CoachClient,
    private readonly fallback: CoachClient = mockCoachClient
  ) {}

  async generatePlanMessage(request: CoachPlanRequest): Promise<CoachMessage> {
    try {
      return await this.primary.generatePlanMessage(request);
    } catch (error) {
      console.warn('Coze plan message failed, falling back to mock:', error);
      const message = await this.fallback.generatePlanMessage(request);
      return { ...message, source: 'mock', fallbackReason: getFallbackReason(error) };
    }
  }

  async generatePlanMessageStream(
    request: CoachPlanRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage> {
    let hasStreamed = false;
    try {
      if (this.primary.generatePlanMessageStream) {
        return await this.primary.generatePlanMessageStream(request, delta => {
          hasStreamed = true;
          onDelta(delta);
        });
      }
      return await this.primary.generatePlanMessage(request);
    } catch (error) {
      console.warn('Coze plan stream failed, falling back to mock:', error);
      if (hasStreamed) {
        throw error;
      }
      const message = await this.fallback.generatePlanMessage(request);
      return { ...message, source: 'mock', fallbackReason: getFallbackReason(error) };
    }
  }

  async respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage> {
    try {
      return await this.primary.respondToFeedback(request);
    } catch (error) {
      console.warn('Coze feedback failed, falling back to mock:', error);
      const message = await this.fallback.respondToFeedback(request);
      return { ...message, source: 'mock', fallbackReason: getFallbackReason(error) };
    }
  }

  async respondToFeedbackStream(
    request: CoachFeedbackRequest,
    onDelta: (delta: string) => void
  ): Promise<CoachMessage> {
    let hasStreamed = false;
    try {
      if (this.primary.respondToFeedbackStream) {
        return await this.primary.respondToFeedbackStream(request, delta => {
          hasStreamed = true;
          onDelta(delta);
        });
      }
      return await this.primary.respondToFeedback(request);
    } catch (error) {
      console.warn('Coze feedback stream failed, falling back to mock:', error);
      if (hasStreamed) {
        throw error;
      }
      const message = await this.fallback.respondToFeedback(request);
      return { ...message, source: 'mock', fallbackReason: getFallbackReason(error) };
    }
  }
}

export function createCoachClient(): CoachClient {
  if (import.meta.env.MODE === 'test') {
    return mockCoachClient;
  }

  if (import.meta.env.VITE_COZE_ENABLED === 'true') {
    try {
      return new ResilientCoachClient(new CozeCoachClient(), mockCoachClient);
    } catch (error) {
      console.warn('Coze client is not configured, using mock:', error);
    }
  }

  return mockCoachClient;
}
