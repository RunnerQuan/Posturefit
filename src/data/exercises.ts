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
  // 新增正面视角问题的动作库（后续可扩展）
  shoulderImbalance: [
    {
      id: 'si-1',
      issueType: 'shoulderImbalance',
      name: '肩部环绕',
      description: '站立或坐姿，双肩向前做环绕动作，然后向后环绕',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=肩部环绕',
      contraindications: [],
    },
    {
      id: 'si-2',
      issueType: 'shoulderImbalance',
      name: '侧平举强化',
      description: '双手持哑铃或矿泉水瓶，侧平举至与肩同高，强化较弱侧肩部',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=侧平举',
      contraindications: ['postpartum'],
    },
    {
      id: 'si-3',
      issueType: 'shoulderImbalance',
      name: '门框胸肌拉伸',
      description: '站在门框前，较低侧手臂支撑门框，身体向对侧旋转拉伸',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=胸肌拉伸',
      contraindications: [],
    },
  ],
  pelvicTilt: [
    {
      id: 'pt-1',
      issueType: 'pelvicTilt',
      name: '侧卧抬腿',
      description: '侧卧于地面，较高侧腿向上抬起后放下，锻炼髋外展肌',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=侧卧抬腿',
      contraindications: [],
    },
    {
      id: 'pt-2',
      issueType: 'pelvicTilt',
      name: '蚌式开合',
      description: '侧卧屈膝，双脚并拢，像贝壳一样打开上方膝盖',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=蚌式开合',
      contraindications: [],
    },
    {
      id: 'pt-3',
      issueType: 'pelvicTilt',
      name: '侧桥支撑',
      description: '侧卧用手肘和脚支撑身体，保持身体成一条直线',
      durationSeconds: 30,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=侧桥支撑',
      contraindications: ['postpartum'],
    },
  ],
  kneeValgus: [
    {
      id: 'kv-1',
      issueType: 'kneeValgus',
      name: '深蹲训练',
      description: '双脚与肩同宽，缓慢下蹲注意膝盖不要内扣，锻炼大腿内外侧肌力平衡',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=深蹲训练',
      contraindications: ['postpartum'],
    },
    {
      id: 'kv-2',
      issueType: 'kneeValgus',
      name: '腿外展训练',
      description: '侧卧将上方腿向上抬起，锻炼髋外展肌帮助稳定膝盖',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=腿外展训练',
      contraindications: [],
    },
    {
      id: 'kv-3',
      issueType: 'kneeValgus',
      name: '单腿硬拉',
      description: '单腿站立，另一侧腿向后抬起同时身体前倾，保持膝盖稳定',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=单腿硬拉',
      contraindications: ['postpartum'],
    },
  ],
  headOffset: [
    {
      id: 'ho-1',
      issueType: 'headOffset',
      name: '颈椎侧屈训练',
      description: '坐姿或站姿，将头向偏移侧相反方向倾斜，拉伸紧张侧肌肉',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=颈椎侧屈训练',
      contraindications: [],
    },
    {
      id: 'ho-2',
      issueType: 'headOffset',
      name: '颈椎旋转训练',
      description: '头部缓慢向左右两侧旋转，保持肩膀不动',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=颈椎旋转训练',
      contraindications: [],
    },
    {
      id: 'ho-3',
      issueType: 'headOffset',
      name: '颈部深层肌肉强化',
      description: '用手轻压头部一侧，收缩颈部肌肉对抗阻力',
      durationSeconds: 30,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=颈部深层肌肉强化',
      contraindications: [],
    },
  ],
  centerOfGravityShift: [
    {
      id: 'cg-1',
      issueType: 'centerOfGravityShift',
      name: '平衡木行走',
      description: '沿直线行走，注意保持身体重心在两脚之间',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=平衡木行走',
      contraindications: [],
    },
    {
      id: 'cg-2',
      issueType: 'centerOfGravityShift',
      name: '单脚站立',
      description: '单脚站立保持平衡，可闭眼增强训练效果',
      durationSeconds: 30,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=单脚站立',
      contraindications: [],
    },
    {
      id: 'cg-3',
      issueType: 'centerOfGravityShift',
      name: '靠墙深蹲',
      description: '背靠墙下蹲至大腿与地面平行，保持重心稳定',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=靠墙深蹲',
      contraindications: ['postpartum'],
    },
  ],
  hunchback: [
    {
      id: 'hb-1',
      issueType: 'hunchback',
      name: '胸椎伸展',
      description: '坐在椅子上，双手抱头向后仰，打开胸椎改善驼背',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=胸椎伸展',
      contraindications: [],
    },
    {
      id: 'hb-2',
      issueType: 'hunchback',
      name: '墙壁天使',
      description: '背靠墙，双臂做上下滑动动作，保持手臂贴墙',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=墙壁天使',
      contraindications: [],
    },
    {
      id: 'hb-3',
      issueType: 'hunchback',
      name: '俯卧T字伸展',
      description: '俯卧，双手呈T字形向上抬起，锻炼背部肌肉',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=T字伸展',
      contraindications: ['postpartum'],
    },
  ],
  kneeHyperextension: [
    {
      id: 'kh-1',
      issueType: 'kneeHyperextension',
      name: '股四头肌强化',
      description: '坐姿伸腿，锻炼股四头肌帮助稳定膝关节',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=股四头肌强化',
      contraindications: [],
    },
    {
      id: 'kh-2',
      issueType: 'kneeHyperextension',
      name: '半蹲训练',
      description: '不完全下蹲，膝盖保持微屈，锻炼腘绳肌平衡股四头肌',
      durationSeconds: 45,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=半蹲训练',
      contraindications: [],
    },
    {
      id: 'kh-3',
      issueType: 'kneeHyperextension',
      name: '腘绳肌拉伸',
      description: '坐姿伸腿向前倾，拉伸腘绳肌减少膝关节过伸倾向',
      durationSeconds: 60,
      bilibiliSearchUrl: 'https://search.bilibili.com/all?keyword=腘绳肌拉伸',
      contraindications: [],
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
  // 正面视角问题
  forwardHead: '头前伸',
  shoulderImbalance: '高低肩',
  pelvicTilt: '骨盆侧倾',
  kneeValgus: '膝内扣',
  headOffset: '头部偏移',
  centerOfGravityShift: '重心偏移',
  // 侧面视角问题
  roundedShoulder: '圆肩',
  anteriorPelvicTilt: '骨盆前倾',
  hunchback: '驼背倾向',
  kneeHyperextension: '膝超伸',
};
