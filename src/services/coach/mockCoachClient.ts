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

    const exercises = [
      {
        id: 'mock-1',
        issueType: primaryIssue ?? 'roundedShoulder',
        name: '肩胛骨后缩',
        description: '坐直或站直，将双肩向后夹紧肩胛骨，保持呼吸平稳。',
        durationSeconds: 60,
        bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=%E8%82%A9%E8%83%9B%E9%AA%A8%E5%90%8E%E7%BC%A9',
      },
      {
        id: 'mock-2',
        issueType: primaryIssue ?? 'roundedShoulder',
        name: '胸椎伸展',
        description: '双手扶住后脑，轻轻打开胸腔，避免腰部代偿。',
        durationSeconds: 60,
        bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=%E8%83%B8%E6%A4%8E%E4%BC%B8%E5%B1%95',
      },
      {
        id: 'mock-3',
        issueType: primaryIssue ?? 'roundedShoulder',
        name: '墙壁天使',
        description: '背靠墙站立，手臂贴墙缓慢上举下放，感受肩胛稳定。',
        durationSeconds: 45,
        bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=%E5%A2%99%E5%A3%81%E5%A4%A9%E4%BD%BF',
      },
    ];

    const planText = `
根据您的体态分析，您存在${issueLabel}问题。以下是今日训练计划：

1. **${exercises[0].name}**（${exercises[0].durationSeconds}秒）
   描述：${exercises[0].description}
   视频参考：[B站搜索](${exercises[0].bilibiliSearchUrl})

2. **${exercises[1].name}**（${exercises[1].durationSeconds}秒）
   描述：${exercises[1].description}
   视频参考：[B站搜索](${exercises[1].bilibiliSearchUrl})

3. **${exercises[2].name}**（${exercises[2].durationSeconds}秒）
   描述：${exercises[2].description}
   视频参考：[B站搜索](${exercises[2].bilibiliSearchUrl})

请按照计划完成训练，完成后点击“做完了”，如果感到疲劳点击“太累了”。

<!-- posturefit:exercises
${JSON.stringify({ exercises })}
-->
`.trim();

    return {
      id: generateId(),
      role: 'assistant',
      content: `${intro}\n\n${planText}`,
      createdAt: getCurrentISOString(),
      source: 'mock',
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
      source: 'mock',
    };
  }
}

export const mockCoachClient = new MockCoachClient();
