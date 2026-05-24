import { Heart, Smile, Zap } from 'lucide-react';
import { COACH_PROFILES, DEFAULT_PROFILE } from '../../data/demoProfiles';
import type { BodyState, CoachGender, CoachStyle, UserProfile } from '../../types';
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
  const [coachGender, setCoachGender] = useState<CoachGender>(initialProfile?.coachGender ?? DEFAULT_PROFILE.coachGender);
  const [userGoal, setUserGoal] = useState(initialProfile?.userGoal ?? DEFAULT_PROFILE.userGoal);
  const [bodyState, setBodyState] = useState<BodyState>(initialProfile?.bodyState ?? DEFAULT_PROFILE.bodyState);

  const selectedCoach = COACH_PROFILES[`${coachStyle}_${coachGender}`];

  return (
    <form
      className="rounded-2xl bg-white p-6 shadow-card"
      onSubmit={event => {
        event.preventDefault();
        onSubmit({ coachStyle, coachGender, userGoal: userGoal.trim() || DEFAULT_PROFILE.userGoal, bodyState });
      }}
    >
      <h2 className="mb-1 text-xl font-semibold text-gray-800">选择你的专属教练</h2>
      <p className="mb-6 text-sm text-gray-500">让 AI 运动搭子用适合你的语气陪你完成训练。</p>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-600">风格倾向</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {STYLE_OPTIONS.map(option => {
            const Icon = option.icon;
            const active = coachStyle === option.value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => setCoachStyle(option.value)}
                className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition ${
                  active ? 'border-primary-400 bg-primary-50/70' : 'border-gray-100 bg-white hover:border-primary-200'
                }`}
              >
                <Icon className={`mb-3 h-5 w-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-800">{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{option.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-600">教练形象</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['female', 'male'] as CoachGender[]).map(gender => {
            const coach = COACH_PROFILES[`${coachStyle}_${gender}`];
            const active = coachGender === gender;
            return (
              <button
                type="button"
                key={gender}
                onClick={() => setCoachGender(gender)}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${
                  active ? 'border-primary-400 bg-primary-50/70' : 'border-gray-100 bg-white hover:border-primary-200'
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${coach.avatarBg} ${coach.avatarColor}`}>
                  {coach.initials}
                </span>
                <span className="text-left">
                  <span className="block text-sm font-semibold text-gray-800">{coach.name}</span>
                  <span className="block text-xs text-gray-500">{coach.bio}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-600">训练目标</span>
          <input
            value={userGoal}
            onChange={event => setUserGoal(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            placeholder="例如：改善圆肩、缓解久坐酸痛"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-600">身体状态</span>
          <select
            value={bodyState}
            onChange={event => setBodyState(event.target.value as BodyState)}
            className="w-full cursor-pointer rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
          >
            {BODY_STATE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-6 rounded-2xl bg-primary-50/70 p-4">
        <p className="text-sm font-semibold text-primary-800">{selectedCoach.name}已就位</p>
        <p className="mt-1 text-sm text-primary-700/75">{selectedCoach.styleLabel} · {selectedCoach.bio}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-2xl bg-gray-50 px-6 py-4 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          返回分析
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-2xl bg-primary-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? '正在生成计划...' : '生成今日计划'}
        </button>
      </div>
    </form>
  );
}
