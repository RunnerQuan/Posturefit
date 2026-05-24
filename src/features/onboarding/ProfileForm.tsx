import { Heart, Smile, Zap } from 'lucide-react';
import { COACH_PROFILES, DEFAULT_PROFILE } from '../../data/demoProfiles';
import type { BodyState, CoachStyle, UserProfile } from '../../types';
import { useState } from 'react';

type ProfileFormProps = {
  initialProfile?: Partial<UserProfile>;
  onSubmit: (profile: UserProfile) => void;
  onBack: () => void;
  isSubmitting?: boolean;
};

const STYLE_OPTIONS: Array<{ value: CoachStyle; label: string; desc: string; icon: typeof Heart }> = [
  { value: 'encouraging', label: '鼓励型', desc: '温柔陪伴，耐心引导', icon: Heart },
  { value: 'strict', label: '严厉型', desc: '高效专业，结果导向', icon: Zap },
  { value: 'humorous', label: '幽默型', desc: '轻松有趣，快乐坚持', icon: Smile },
];

const BODY_STATE_OPTIONS: Array<{ value: BodyState; label: string }> = [
  { value: 'normal', label: '日常状态' },
  { value: 'postpartum', label: '产后恢复' },
  { value: 'menstrual', label: '生理期' },
  { value: 'fatigued', label: '疲劳状态' },
  { value: 'teenager', label: '青少年' },
];

export function ProfileForm({ initialProfile, onSubmit, onBack, isSubmitting = false }: ProfileFormProps) {
  const [coachStyle, setCoachStyle] = useState<CoachStyle>(initialProfile?.coachStyle ?? DEFAULT_PROFILE.coachStyle);
  const [userGoal, setUserGoal] = useState(initialProfile?.userGoal ?? DEFAULT_PROFILE.userGoal);
  const [bodyState, setBodyState] = useState<BodyState>(initialProfile?.bodyState ?? DEFAULT_PROFILE.bodyState);

  const coachGender = 'female' as const;
  const selectedCoach = COACH_PROFILES[`${coachStyle}_${coachGender}`];

  return (
    <form
      className="rounded-2xl bg-gradient-to-br from-white/90 to-blush-50/50 p-5 shadow-soft border border-white/50 backdrop-blur-md"
      onSubmit={event => {
        event.preventDefault();
        onSubmit({ coachStyle, coachGender, userGoal: userGoal.trim() || DEFAULT_PROFILE.userGoal, bodyState });
      }}
    >
      <h2 className="mb-1 text-xl font-semibold text-blush-700">定制你的 AI 运动搭子</h2>
      <p className="mb-6 text-sm text-mist-600">系统将由女性数字人教练陪你训练，你只需要选择她的沟通风格和你的身体状态。</p>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-blush-600">风格倾向</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {STYLE_OPTIONS.map(option => {
            const Icon = option.icon;
            const active = coachStyle === option.value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => setCoachStyle(option.value)}
                className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition-all ${
                  active
                    ? 'border-blush-400 bg-gradient-to-br from-blush-50/70 to-mist-50/70 shadow-soft'
                    : 'border-blush-100/50 bg-white/70 backdrop-blur-sm hover:border-blush-200 hover:bg-white/90 hover:shadow-soft'
                }`}
              >
                <Icon className={`mb-3 h-5 w-5 ${active ? 'text-blush-500' : 'text-mist-400'}`} />
                <p className={`text-sm font-semibold ${active ? 'text-blush-600' : 'text-gray-700'}`}>{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-mist-500">{option.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-blush-600">训练目标</span>
          <input
            value={userGoal}
            onChange={event => setUserGoal(event.target.value)}
            className="w-full rounded-2xl border border-blush-200 px-4 py-3 text-sm outline-none transition focus:border-blush-400 focus:ring-4 focus:ring-blush-100/50 bg-white"
            placeholder="例如：改善圆肩、缓解久坐酸痛"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-blush-600">身体状态</span>
          <select
            value={bodyState}
            onChange={event => setBodyState(event.target.value as BodyState)}
            className="w-full cursor-pointer rounded-2xl border border-blush-200 px-4 py-3 text-sm outline-none transition focus:border-blush-400 focus:ring-4 focus:ring-blush-100/50 bg-white"
          >
            {BODY_STATE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blush-50/70 to-mist-50/70 p-4 border border-blush-100/50 backdrop-blur-sm">
        <p className="text-sm font-semibold text-blush-600">{selectedCoach.name}已就位</p>
        <p className="mt-1 text-sm text-mist-600/80">女性数字人教练 · {selectedCoach.styleLabel} · {selectedCoach.bio}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-2xl bg-white border border-blush-100 px-8 py-4 text-base font-medium text-mist-600 transition hover:bg-blush-50 hover:border-blush-200"
        >
          返回分析
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-2xl bg-gradient-to-r from-blush-500 to-mist-500 px-10 py-4 text-base font-semibold text-white transition hover:from-blush-600 hover:to-mist-600 disabled:cursor-wait disabled:opacity-70 shadow-bubble"
        >
          {isSubmitting ? '正在连接教练...' : '进入 AI 陪练'}
        </button>
      </div>
    </form>
  );
}
