import type { PostureIssueType, Exercise, BodyState } from '../types';

export const EXERCISES: Record<PostureIssueType, Exercise[]> = {
  forwardHead: [
    {
      id: 'fh-1',
      issueType: 'forwardHead',
      name: '颈部后缩训练',
      description: '靠墙站立，将下巴向后收，保持颈部伸直，感受颈部后侧肌肉发力',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=颈部后缩训练',
      contraindications: [],
    },
    {
      id: 'fh-2',
      issueType: 'forwardHead',
      name: '上斜方肌拉伸',
      description: '坐姿或站姿，将头向一侧倾斜，用手轻轻加压，保持30秒后换边',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=上斜方肌拉伸',
      contraindications: ['menstrual'],
    },
    {
      id: 'fh-3',
      issueType: 'forwardHead',
      name: '颈深屈肌强化',
      description: '平躺或靠墙，将一个拳头放在下巴下方，轻轻下压同时收下巴',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=颈深屈肌强化',
      contraindications: [],
    },
  ],
  roundedShoulder: [
    {
      id: 'rs-1',
      issueType: 'roundedShoulder',
      name: '胸肌拉伸',
      description: '站在门框前，双手撑在门框上，身体前倾拉伸胸部肌肉',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=胸肌拉伸',
      contraindications: ['postpartum'],
    },
    {
      id: 'rs-2',
      issueType: 'roundedShoulder',
      name: '菱形肌强化',
      description: '俯卧在地面或垫子上，双手向后方伸展，抬起上半身',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=菱形肌强化',
      contraindications: ['postpartum'],
    },
    {
      id: 'rs-3',
      issueType: 'roundedShoulder',
      name: '肩胛骨后缩',
      description: '坐直或站直，将双肩向后夹紧肩胛骨，保持5秒后放松',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=肩胛骨后缩',
      contraindications: [],
    },
  ],
  anteriorPelvicTilt: [
    {
      id: 'ap-1',
      issueType: 'anteriorPelvicTilt',
      name: '骨盆后倾训练',
      description: '平躺在地面，屈膝，将腰部贴紧地面感受骨盆后倾',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=骨盆后倾训练',
      contraindications: [],
    },
    {
      id: 'ap-2',
      issueType: 'anteriorPelvicTilt',
      name: '臀桥',
      description: '平躺屈膝，收紧臀部抬起髋部至身体成一条直线',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=臀桥',
      contraindications: ['postpartum'],
    },
    {
      id: 'ap-3',
      issueType: 'anteriorPelvicTilt',
      name: '髋屈肌拉伸',
      description: '弓步姿势，后腿膝盖着地，身体前倾感受髋屈肌拉伸',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=髋屈肌拉伸',
      contraindications: ['menstrual'],
    },
  ],
};

export function filterExercisesByBodyState(
  exercises: Exercise[],
  bodyState: BodyState
): Exercise[] {
  if (bodyState === 'normal') {
    return exercises;
  }
  return exercises.filter(ex => !ex.contraindications?.includes(bodyState));
}

export function selectExercisesForIssue(
  issueType: PostureIssueType,
  bodyState: BodyState,
  count: number = 3
): Exercise[] {
  const available = filterExercisesByBodyState(EXERCISES[issueType] || [], bodyState);
  return available.slice(0, count);
}

export const ISSUE_LABELS: Record<PostureIssueType, string> = {
  forwardHead: '头前伸',
  roundedShoulder: '圆肩',
  anteriorPelvicTilt: '骨盆前倾',
};
