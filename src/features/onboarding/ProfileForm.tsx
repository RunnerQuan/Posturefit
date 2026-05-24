import { COACH_PROFILES, DEFAULT_PROFILE } from '../../data/demoProfiles';
import type { BodyState, CoachStyle, UserProfile } from '../../types';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import encourageImage from '../../../assets/encourage_clean.png';
import strictImage from '../../../assets/strict_clean.png';
import humorousImage from '../../../assets/humorous_clean.png';

type ProfileFormProps = {
  initialProfile?: Partial<UserProfile>;
  onSubmit: (profile: UserProfile) => void;
  onBack: () => void;
  isSubmitting?: boolean;
};

const STYLE_OPTIONS: Array<{ value: CoachStyle; label: string; desc: string; image: string }> = [
  { value: 'encouraging', label: '鼓励型', desc: '温柔陪伴，耐心引导', image: encourageImage },
  { value: 'strict', label: '严厉型', desc: '高效专业，结果导向', image: strictImage },
  { value: 'humorous', label: '幽默型', desc: '轻松有趣，快乐坚持', image: humorousImage },
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
  const [isBodyStateOpen, setIsBodyStateOpen] = useState(false);

  const coachGender = 'female' as const;
  const selectedCoach = COACH_PROFILES[`${coachStyle}_${coachGender}`];
  const selectedBodyState = BODY_STATE_OPTIONS.find(option => option.value === bodyState) ?? BODY_STATE_OPTIONS[0];

  return (
    <form
      className="rounded-2xl bg-gradient-to-br from-white/90 to-blush-50/50 p-5 shadow-soft border border-white/50 backdrop-blur-md"
      onSubmit={event => {
        event.preventDefault();
        onSubmit({ coachStyle, coachGender, userGoal: userGoal.trim() || DEFAULT_PROFILE.userGoal, bodyState });
      }}
    >
      <h2 className="mb-1 text-xl font-semibold text-blush-700">定制你的 AI 运动教练</h2>
      <p className="mb-6 text-sm text-mist-600">系统将由爱可陪你训练，你只需要选择她的沟通风格和你的身体状态。</p>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-blush-600">风格倾向</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {STYLE_OPTIONS.map(option => {
            const active = coachStyle === option.value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => setCoachStyle(option.value)}
                className={`cursor-pointer overflow-hidden rounded-2xl border-2 p-3 text-center transition-all ${
                  active
                    ? 'border-blush-400 bg-gradient-to-br from-blush-50/70 to-mist-50/70 shadow-soft'
                    : 'border-blush-100/50 bg-white/70 backdrop-blur-sm hover:border-blush-200 hover:bg-white/90 hover:shadow-soft'
                }`}
              >
                <div className={`mb-3 flex h-44 items-center justify-center rounded-2xl bg-white/80 ${
                  active ? 'ring-2 ring-blush-200/80' : 'ring-1 ring-blush-100/60'
                }`}>
                  <img src={option.image} alt="" className="h-full w-full object-contain p-0.5" />
                </div>
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
        <div
          className="relative block"
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsBodyStateOpen(false);
            }
          }}
        >
          <span className="mb-2 block text-sm font-medium text-blush-600">身体状态</span>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isBodyStateOpen}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-blush-200 bg-white/55 px-4 py-3 text-left text-sm text-gray-900 shadow-soft backdrop-blur-xl outline-none transition hover:border-blush-300 hover:bg-white/70 focus:border-blush-400 focus:ring-4 focus:ring-blush-100/50"
            onClick={() => setIsBodyStateOpen(open => !open)}
          >
            <span>{selectedBodyState.label}</span>
            <ChevronDown className={`h-4 w-4 text-blush-500 transition-transform ${isBodyStateOpen ? 'rotate-180' : ''}`} />
          </button>
          {isBodyStateOpen && (
            <div
              role="listbox"
              className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-bubble backdrop-blur-2xl ring-1 ring-blush-100/70"
            >
              {BODY_STATE_OPTIONS.map(option => {
                const active = option.value === bodyState;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'bg-gradient-to-r from-blush-500/90 to-mist-500/90 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-white/80 hover:text-blush-700'
                    }`}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                      setBodyState(option.value);
                      setIsBodyStateOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {active && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blush-50/70 to-mist-50/70 p-4 border border-blush-100/50 backdrop-blur-sm">
        <p className="text-sm font-semibold text-blush-600">{selectedCoach.name}已就位</p>
        <p className="mt-1 text-sm text-mist-600/80">AI 运动教练 · {selectedCoach.styleLabel} · {selectedCoach.bio}</p>
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
