import { Activity, Dumbbell, RotateCcw, UserRound } from 'lucide-react';
import { getSessionDisplayAnalysis, getSessionDisplayIssueLabel, getSessionDisplayPhotos } from '../../lib/sessionAnalysis';
import type { BodyState, CoachStyle, PostureSession } from '../../types';

type SessionSummaryPanelProps = {
  session: PostureSession;
  onRestart: () => void;
};

const BODY_STATE_LABELS: Record<BodyState, string> = {
  normal: '日常状态',
  postpartum: '产后恢复',
  menstrual: '生理期',
  fatigued: '疲劳状态',
  teenager: '青少年',
};

const COACH_STYLE_LABELS: Record<CoachStyle, string> = {
  encouraging: '鼓励型',
  strict: '严厉型',
  humorous: '幽默型',
};

function getScore(session: PostureSession): number | undefined {
  return getSessionDisplayAnalysis(session)?.score;
}

function getScoreColor(score: number | undefined): string {
  if (typeof score !== 'number') {
    return '#cbd5e1';
  }
  if (score <= 60) {
    return '#ef4444';
  }
  if (score <= 80) {
    return '#f59e0b';
  }
  return '#22c55e';
}

export function SessionSummaryPanel({ session, onRestart }: SessionSummaryPanelProps) {
  const score = getScore(session);
  const scoreValue = typeof score === 'number' ? score : 0;
  const scoreColor = getScoreColor(score);
  const displayPhotos = getSessionDisplayPhotos(session);
  const photos = displayPhotos.length > 0
    ? displayPhotos
    : session.imageDataUrl
      ? [{ id: 'legacy-image', imageUrl: session.imageDataUrl, view: 'front' as const }]
      : [];

  return (
    <aside className="flex h-[calc(100vh-10.5rem)] min-h-[600px] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-soft backdrop-blur-xl">
      <div className="border-b border-blush-100/60 px-5 py-3">
        <h2 className="text-lg font-semibold text-blush-700">本次评估</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 custom-scrollbar">
        <section className="rounded-2xl bg-gradient-to-br from-blush-50/80 to-mist-50/70 p-2.5">
          <div className={`grid gap-2 ${photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {photos.slice(0, 2).map(photo => (
              <div key={photo.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <img src={photo.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
              </div>
            ))}
            {photos.length === 0 && (
              <div className="col-span-2 flex aspect-[4/3] items-center justify-center rounded-xl bg-white/80 text-sm text-mist-400">
                暂无图片
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-blush-100/70 bg-white/75 p-3">
          <div className="flex items-center gap-4">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${scoreColor} ${scoreValue * 3.6}deg, #f1f5f9 0deg)`,
              }}
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center">
                <span className="text-lg font-bold" style={{ color: scoreColor }}>
                  {typeof score === 'number' ? score.toFixed(1) : '--'}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-mist-500">
                <Activity className="h-3.5 w-3.5" />
                分析评分
              </p>
              <h3 className="mt-1 truncate text-xl font-semibold text-gray-900">
                {getSessionDisplayIssueLabel(session, { pendingLabel: '待分析' })}
              </h3>
              <p className="mt-1 text-xs leading-5 text-mist-500">高分更接近绿色健康区间。</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blush-100/70 bg-white/75 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blush-700">
            <UserRound className="h-4 w-4" />
            教练配置
          </div>
          {session.profile ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blush-50 px-3 py-1 text-blush-700">{COACH_STYLE_LABELS[session.profile.coachStyle]}</span>
                <span className="rounded-full bg-mist-50 px-3 py-1 text-mist-700">{BODY_STATE_LABELS[session.profile.bodyState]}</span>
              </div>
              <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                目标：{session.profile.userGoal}
              </p>
            </div>
          ) : (
            <p className="text-sm text-mist-500">尚未完成教练配置。</p>
          )}
        </section>

        <section className="rounded-2xl border border-blush-100/70 bg-white/75 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blush-700">
            <Dumbbell className="h-4 w-4" />
            训练计划
          </div>
          {session.plan ? (
            <div className="space-y-2">
              {session.plan.exercises.slice(0, 3).map((exercise, index) => (
                <div key={exercise.id} className="flex items-center gap-3 rounded-xl bg-blush-50/60 px-3 py-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-blush-600">
                    {index + 1}
                  </span>
                  <p className="min-w-0 truncate text-sm text-gray-700">{exercise.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-mist-500">进入陪练后会生成训练计划。</p>
          )}
        </section>
      </div>

      <div className="border-t border-blush-100/60 p-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blush-500 to-mist-500 px-4 py-3 text-sm font-semibold text-white shadow-bubble transition hover:from-blush-600 hover:to-mist-600"
        >
          <RotateCcw className="h-4 w-4" />
          新建评估
        </button>
      </div>
    </aside>
  );
}
