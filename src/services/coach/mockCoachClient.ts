import type { CoachMessage } from '../../types';
import { MOCK_RESPONSES } from '../../data/demoProfiles';
import { ISSUE_LABELS } from '../../data/exercises';
import { generateId } from '../../lib/ids';
import { getCurrentISOString } from '../../lib/time';
import type { CoachClient, CoachPlanRequest, CoachFeedbackRequest } from '../../types';

export class MockCoachClient implements CoachClient {
  async generatePlanMessage(request: CoachPlanRequest): Promise<CoachMessage> {
    const { analysis, profile } = request;
    const primaryIssue = analysis.primaryIssue;
    const issueLabel = primaryIssue ? ISSUE_LABELS[primaryIssue] : '体态';

    const intro = MOCK_RESPONSES.planIntro(profile, issueLabel);

    const planText = `
根据您的体态分析，您存在${issueLabel}问题。以下是今日训练计划：

1. **${request.plan.exercises[0]?.name || '动作1'}**（${request.plan.exercises[0]?.durationSeconds || 60}秒）
   描述：${request.plan.exercises[0]?.description || '训练动作'}
   视频参考：[B站搜索](${request.plan.exercises[0]?.bilibiliSearchUrl || 'https://search.bilibili.com'})

2. **${request.plan.exercises[1]?.name || '动作2'}**（${request.plan.exercises[1]?.durationSeconds || 45}秒）
   描述：${request.plan.exercises[1]?.description || '训练动作'}
   视频参考：[B站搜索](${request.plan.exercises[1]?.bilibiliSearchUrl || 'https://search.bilibili.com'})

3. **${request.plan.exercises[2]?.name || '动作3'}**（${request.plan.exercises[2]?.durationSeconds || 60}秒）
   描述：${request.plan.exercises[2]?.description || '训练动作'}
   视频参考：[B站搜索](${request.plan.exercises[2]?.bilibiliSearchUrl || 'https://search.bilibili.com'})

请按照计划完成训练，完成后请回复"做完了"，如果感到疲劳请回复"太累了"。
`.trim();

    return {
      id: generateId(),
      role: 'assistant',
      content: `${intro}\n\n${planText}`,
      createdAt: getCurrentISOString(),
    };
  }

  async respondToFeedback(request: CoachFeedbackRequest): Promise<CoachMessage> {
    const { profile, feedback } = request;

    let response: string;
    if (feedback === 'completed') {
      response = MOCK_RESPONSES.checkInCompleted(profile);
    } else {
      response = MOCK_RESPONSES.checkInTired(profile);
    }

    return {
      id: generateId(),
      role: 'assistant',
      content: response,
      createdAt: getCurrentISOString(),
    };
  }
}

export const mockCoachClient = new MockCoachClient();
