import type { CoachClient, CoachFeedbackRequest, CoachMessage, CoachPlanRequest } from '../../types';
import { CozeCoachClient } from './cozeCoachClient';
import { mockCoachClient } from './mockCoachClient';

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
      return this.fallback.generatePlanMessage(request);
    }
  }

  async respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage> {
    try {
      return await this.primary.respondToFeedback(request);
    } catch (error) {
      console.warn('Coze feedback failed, falling back to mock:', error);
      return this.fallback.respondToFeedback(request);
    }
  }
}

export function createCoachClient(): CoachClient {
  if (import.meta.env.VITE_COZE_ENABLED === 'true') {
    try {
      return new ResilientCoachClient(new CozeCoachClient(), mockCoachClient);
    } catch (error) {
      console.warn('Coze client is not configured, using mock:', error);
    }
  }

  return mockCoachClient;
}
