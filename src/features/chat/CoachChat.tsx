import { RotateCcw } from 'lucide-react';
import { formatDate } from '../../lib/time';
import type { CheckInFeedback, CoachMessage, TrainingPlan } from '../../types';

type CoachChatProps = {
  messages: CoachMessage[];
  plan: TrainingPlan;
  isResponding: boolean;
  onFeedback: (feedback: CheckInFeedback) => void;
  onRestart: () => void;
};

const FEEDBACK_LABELS: Record<CheckInFeedback, string> = {
  completed: '做完了',
  tooTired: '太累了',
};

export function CoachChat({ messages, plan, isResponding, onFeedback, onRestart }: CoachChatProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-600">训练打卡</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">今天完成 {plan.exercises.length} 个动作了吗？</h2>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          <RotateCcw className="h-4 w-4" />
          重新评估
        </button>
      </div>

      <div className="max-h-[460px] space-y-4 overflow-y-auto rounded-2xl bg-gradient-to-br from-primary-50/70 to-white p-4">
        {messages.map(message => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  isUser
                    ? 'rounded-br-md bg-primary-500 text-white'
                    : 'rounded-bl-md bg-white text-gray-700'
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
                <p className={`mt-2 text-[11px] ${isUser ? 'text-white/70' : 'text-gray-400'}`}>{formatDate(message.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {isResponding && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">AI 运动搭子正在回复...</div>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {(Object.keys(FEEDBACK_LABELS) as CheckInFeedback[]).map(feedback => (
          <button
            key={feedback}
            type="button"
            disabled={isResponding}
            onClick={() => onFeedback(feedback)}
            className={`cursor-pointer rounded-2xl px-6 py-4 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 ${
              feedback === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {FEEDBACK_LABELS[feedback]}
          </button>
        ))}
      </div>
    </section>
  );
}
