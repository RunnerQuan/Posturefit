import { ExternalLink, MessageCircle, Timer } from 'lucide-react';
import { formatDuration } from '../../lib/time';
import type { CoachMessage, TrainingPlan } from '../../types';
import { getTrainingPlanTitle } from './generateTrainingPlan';

type PlanViewProps = {
  plan: TrainingPlan;
  coachMessage?: CoachMessage;
  onStartTraining: () => void;
  onBack: () => void;
};

export function PlanView({ plan, coachMessage, onStartTraining, onBack }: PlanViewProps) {
  const totalSeconds = plan.exercises.reduce((sum, exercise) => sum + exercise.durationSeconds, 0);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white/80 backdrop-blur-md p-5 shadow-soft border border-white/50">
        <p className="text-sm font-medium text-blush-500">今日训练计划</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-blush-700">{getTrainingPlanTitle(plan)}</h2>
            <p className="mt-2 text-sm text-mist-600">3 个动作，预计 {formatDuration(totalSeconds)}，强度 {plan.intensity === 'low' ? '低' : '中'}。</p>
          </div>
          <button
            type="button"
            onClick={onStartTraining}
            className="cursor-pointer rounded-2xl bg-gradient-to-r from-blush-500 to-mist-500 px-10 py-4 text-base font-semibold text-white transition hover:from-blush-600 hover:to-mist-600 shadow-bubble"
          >
            去打卡
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {plan.exercises.map((exercise, index) => (
          <a
            key={exercise.id}
            href={exercise.bilibiliSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/80 p-5 shadow-soft backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-bubble focus-visible:-translate-y-1 focus-visible:shadow-bubble focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(125,211,252,0.18),transparent_42%)] opacity-90 transition duration-300 group-hover:scale-105" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-blush-500">动作 {index + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold text-blush-700 transition group-hover:text-blush-800">{exercise.name}</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-blush-100 bg-gradient-to-r from-blush-50 to-mist-50 px-3 py-1 text-xs font-medium text-blush-600 transition group-hover:from-blush-100 group-hover:to-mist-100">
                  <Timer className="h-3.5 w-3.5" />
                  {formatDuration(exercise.durationSeconds)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-mist-700">{exercise.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blush-100 bg-gradient-to-r from-blush-50 to-mist-50 px-4 py-2 text-sm font-medium text-blush-600 transition group-hover:from-blush-100 group-hover:to-mist-100">
                B站跟练参考
                <ExternalLink className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {coachMessage && (
        <section className="rounded-2xl bg-white/80 backdrop-blur-md p-5 shadow-soft border border-white/50">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-blush-600 to-mist-600 bg-clip-text text-transparent">
            <MessageCircle className="h-4 w-4 text-blush-500" />
            AI 运动教练建议
          </div>
          <p className="whitespace-pre-line text-sm leading-7 text-mist-700">{coachMessage.content}</p>
        </section>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full cursor-pointer rounded-2xl bg-white/80 backdrop-blur-sm border border-blush-100 px-8 py-4 text-base font-medium text-blush-600 transition hover:bg-blush-50"
      >
        返回修改偏好
      </button>
    </section>
  );
}
