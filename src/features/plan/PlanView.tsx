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
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <p className="text-sm font-medium text-primary-600">今日训练计划</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{getTrainingPlanTitle(plan)}</h2>
            <p className="mt-2 text-sm text-gray-500">3 个动作，预计 {formatDuration(totalSeconds)}，强度 {plan.intensity === 'low' ? '低' : '中'}。</p>
          </div>
          <button
            type="button"
            onClick={onStartTraining}
            className="cursor-pointer rounded-2xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            去打卡
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {plan.exercises.map((exercise, index) => (
          <article key={exercise.id} className="rounded-2xl bg-white p-5 shadow-card transition hover:shadow-card-hover">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-primary-500">动作 {index + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">{exercise.name}</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                <Timer className="h-3.5 w-3.5" />
                {formatDuration(exercise.durationSeconds)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">{exercise.description}</p>
            <a
              href={exercise.bilibiliSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-primary-50 hover:text-primary-700"
            >
              B站跟练参考
              <ExternalLink className="h-4 w-4" />
            </a>
          </article>
        ))}
      </div>

      {coachMessage && (
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <MessageCircle className="h-4 w-4 text-primary-500" />
            AI 运动搭子建议
          </div>
          <p className="whitespace-pre-line text-sm leading-7 text-gray-600">{coachMessage.content}</p>
        </section>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full cursor-pointer rounded-2xl bg-gray-50 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
      >
        返回修改偏好
      </button>
    </section>
  );
}
