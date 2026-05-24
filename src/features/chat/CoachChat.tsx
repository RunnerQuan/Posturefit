import { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, UserRound } from 'lucide-react';
import { formatDate } from '../../lib/time';
import type { CheckInFeedback, CoachMessage, TrainingPlan } from '../../types';

type CoachChatProps = {
  messages: CoachMessage[];
  plan: TrainingPlan;
  isResponding: boolean;
  onFeedback: (feedback: CheckInFeedback, feedbackText?: string) => void;
  onRestart: () => void;
};

const FEEDBACK_LABELS: Record<CheckInFeedback, string> = {
  completed: '做完了',
  tooTired: '太累了',
};

export function CoachChat({ messages, plan, isResponding, onFeedback, onRestart }: CoachChatProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const submitFeedback = (feedback: CheckInFeedback, text = '') => {
    const normalized = text.trim();
    onFeedback(feedback, normalized || undefined);
    setFeedbackText('');
  };

  const inferredFeedback: CheckInFeedback = /累|酸|难|做不动|疼|痛/.test(feedbackText) ? 'tooTired' : 'completed';

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isResponding]);

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-card">
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

      <div
        ref={scrollContainerRef}
        className="max-h-[520px] min-h-[360px] space-y-2 overflow-y-auto rounded-[26px] border border-primary-50 bg-gradient-to-br from-primary-50/60 via-white to-white px-4 py-5"
        aria-live="polite"
      >
        {messages.map(message => {
          const isUser = message.role === 'user';
          const isStreamingDraft = !isUser && !message.content && isResponding;
          return (
            <div key={message.id} className={`flex gap-3 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-5 py-4 text-sm leading-7 shadow-sm ${
                  isUser
                    ? 'rounded-[24px] rounded-br-md bg-primary-500 text-white'
                    : 'rounded-[24px] rounded-bl-md border border-gray-100 bg-white text-gray-700'
                }`}
              >
                {isStreamingDraft ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary-400" />
                    正在连接 AI 教练...
                  </div>
                ) : (
                  <p className="whitespace-pre-line break-words">
                    {message.content}
                    {!isUser && isResponding && messages[messages.length - 1]?.id === message.id && (
                      <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-primary-400 align-[-2px]" />
                    )}
                  </p>
                )}
                <p className={`mt-2 text-[11px] ${isUser ? 'text-white/70' : 'text-gray-400'}`}>{formatDate(message.createdAt)}</p>
              </div>
              {isUser && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <UserRound className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {(Object.keys(FEEDBACK_LABELS) as CheckInFeedback[]).map(feedback => (
          <button
            key={feedback}
            type="button"
            disabled={isResponding}
            onClick={() => submitFeedback(feedback, FEEDBACK_LABELS[feedback])}
            className={`cursor-pointer rounded-2xl px-6 py-4 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 ${
              feedback === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {FEEDBACK_LABELS[feedback]}
          </button>
        ))}
      </div>

      <form
        className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-3"
        onSubmit={event => {
          event.preventDefault();
          if (!feedbackText.trim() || isResponding) {
            return;
          }
          submitFeedback(inferredFeedback, feedbackText);
        }}
      >
        <label className="text-xs font-medium text-primary-700" htmlFor="coach-feedback">
          跟 AI 运动搭子说说刚才的感受
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="coach-feedback"
            value={feedbackText}
            disabled={isResponding}
            onChange={event => setFeedbackText(event.target.value)}
            placeholder="例如：做完了，肩膀有点酸；太累了，想减量"
            className="min-h-11 flex-1 rounded-full border border-white bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-wait"
          />
          <button
            type="submit"
            disabled={isResponding || !feedbackText.trim()}
            className="cursor-pointer rounded-full bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            发送给教练
          </button>
        </div>
      </form>
    </section>
  );
}
