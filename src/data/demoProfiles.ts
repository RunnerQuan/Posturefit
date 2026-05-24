import type { CoachStyle, CoachGender, UserProfile } from '../types';

export type CoachProfileKey = `${CoachStyle}_${CoachGender}`;

export const COACH_NAME = '爱可';

export const COACH_PROFILES: Record<CoachProfileKey, {
  name: string;
  initials: string;
  avatarColor: string;
  avatarBg: string;
  bio: string;
  styleLabel: string;
}> = {
  encouraging_female: {
    name: COACH_NAME,
    initials: '爱',
    avatarColor: 'text-pink-600',
    avatarBg: 'bg-pink-100',
    bio: '温柔鼓励，陪你一起进步',
    styleLabel: '鼓励型',
  },
  encouraging_male: {
    name: COACH_NAME,
    initials: '爱',
    avatarColor: 'text-pink-600',
    avatarBg: 'bg-pink-100',
    bio: '耐心指导，每一步都算数',
    styleLabel: '鼓励型',
  },
  strict_female: {
    name: COACH_NAME,
    initials: '爱',
    avatarColor: 'text-blue-600',
    avatarBg: 'bg-blue-100',
    bio: '严格专业，追求效果',
    styleLabel: '严厉型',
  },
  strict_male: {
    name: COACH_NAME,
    initials: '爱',
    avatarColor: 'text-blue-600',
    avatarBg: 'bg-blue-100',
    bio: '高效训练，结果导向',
    styleLabel: '严厉型',
  },
  humorous_female: {
    name: COACH_NAME,
    initials: '爱',
    avatarColor: 'text-amber-600',
    avatarBg: 'bg-amber-100',
    bio: '轻松幽默，快乐健身',
    styleLabel: '幽默型',
  },
  humorous_male: {
    name: COACH_NAME,
    initials: '爱',
    avatarColor: 'text-amber-600',
    avatarBg: 'bg-amber-100',
    bio: '段子手带你练，枯燥说拜拜',
    styleLabel: '幽默型',
  },
};

export const DEFAULT_PROFILE: UserProfile = {
  coachStyle: 'encouraging',
  coachGender: 'female',
  userGoal: '改善体态',
  bodyState: 'normal',
};

export const MOCK_RESPONSES = {
  planIntro: (profile: UserProfile, issue: string) => {
    const coach = COACH_PROFILES[`${profile.coachStyle}_${profile.coachGender}`];
    const greetings = {
      encouraging: `太棒了！我看到您的${issue}问题，别担心，我们一起慢慢改善！`,
      strict: `检测到您存在${issue}问题，需要认真对待。`,
      humorous: `哈！看来您的${issue}问题让您看起来像个思考者（x）。
      开玩笑的啦，让我们一起把它纠正过来！`,
    };
    return `${coach.name}在这里！${greetings[profile.coachStyle]}`;
  },
  checkInCompleted: (profile: UserProfile) => {
    const responses = {
      encouraging: '太厉害了！您已完成今日训练，坚持就是胜利！',
      strict: '已完成。继续保持，明天同一时间见。',
      humorous: '哇哦！您刚才那几下肯定把赘肉吓跑了！继续保持~',
    };
    return responses[profile.coachStyle];
  },
  checkInTired: (profile: UserProfile) => {
    const responses = {
      encouraging: '累了就休息，身体需要恢复。明天我们继续加油！',
      strict: '疲劳状态下不适合继续训练。好好休息，明天再战。',
      humorous: '哎呀，人不是机器嘛！躺平一下也不丢人，明天再来！',
    };
    return responses[profile.coachStyle];
  },
};
