import { useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, RefreshCw, RotateCcw, SendHorizontal, Timer, UserRound } from 'lucide-react';
import { formatDate, formatDuration } from '../../lib/time';
import type { CheckInFeedback, CoachMessage, TrainingPlan } from '../../types';
import { MarkdownMessage } from './MarkdownMessage';
import { stripExerciseBlock } from './exerciseBlock';

type CoachChatProps = {
  messages: CoachMessage[];
  plan?: TrainingPlan;
  isResponding: boolean;
  onFeedback: (feedback: CheckInFeedback, feedbackText?: string) => void;
  onRequestNewPlan: () => void;
  onRestart: () => void;
};

const FEEDBACK_LABELS: Record<CheckInFeedback, string> = {
  completed: '做完了',
  tooTired: '太累了',
};

export function CoachChat({ messages, plan, isResponding, onFeedback, onRequestNewPlan, onRestart }: CoachChatProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const submitFeedback = (feedback: CheckInFeedback, text = '') => {
    const normalized = text.trim();
    onFeedback(feedback, normalized || undefined);
    setFeedbackText('');
  };

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isResponding]);

  return (
    <section className="mx-auto w-full max-w-5xl overflow-visible rounded-[32px] border border-white/80 bg-white/90 shadow-card backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-primary-50 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-primary-600">AI 陪练</p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-950">
            {plan ? `今天完成 ${plan.exercises.length} 个动作了吗？` : 'AI 教练正在生成今日训练'}
          </h2>
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

      {plan && (
        <div className="grid gap-3 border-b border-primary-50 bg-gradient-to-r from-primary-50/60 via-white to-cyan-50/60 px-6 py-4 md:grid-cols-3">
          {plan.exercises.map((exercise, index) => (
            <article key={exercise.id} className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold text-primary-600">动作 {index + 1}</p>
              <h3 className="mt-1 text-base font-semibold text-gray-900">{exercise.name}</h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-600">{exercise.description}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary-700">
                  <Timer className="h-3.5 w-3.5" />
                  {formatDuration(exercise.durationSeconds)}
                </span>
                <a
                  href={exercise.bilibiliSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:text-primary-700"
                >
                  视频
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="scroll-smooth bg-gradient-to-b from-white via-white to-primary-50/30 px-5 py-8"
        aria-live="polite"
      >
        {messages.map(message => {
          const isUser = message.role === 'user';
          const isStreamingDraft = !isUser && !message.content && isResponding;
          return (
            <div key={message.id} className={`mx-auto flex w-full max-w-3xl gap-4 py-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`text-base leading-8 ${
                  isUser
                    ? 'max-w-[72%] rounded-[24px] bg-primary-500 px-5 py-3 text-white shadow-sm'
                    : 'max-w-[min(760px,calc(100%-3rem))] text-gray-800'
                }`}
              >
                {isStreamingDraft ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-3 text-sm text-gray-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary-400" />
                    正在连接 AI 教练...
                  </div>
                ) : (
                  <div>
                    {isUser ? (
                      <p className="whitespace-pre-line break-words">{message.content}</p>
                    ) : (
                      <MarkdownMessage content={stripExerciseBlock(message.content)} />
                    )}
                    {!isUser && isResponding && messages[messages.length - 1]?.id === message.id && (
                      <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-primary-400 align-[-2px]" />
                    )}
                  </div>
                )}
                <p className={`mt-2 text-xs ${isUser ? 'text-white/70' : 'text-gray-400'}`}>{formatDate(message.createdAt)}</p>
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

      <form
        className="sticky bottom-0 z-20 rounded-b-[32px] border-t border-primary-50 bg-white/95 px-5 py-4 backdrop-blur"
        onSubmit={event => {
          event.preventDefault();
          if (!feedbackText.trim() || isResponding) {
            return;
          }
          submitFeedback('completed', feedbackText);
        }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(FEEDBACK_LABELS) as CheckInFeedback[]).map(feedback => (
              <button
                key={feedback}
                type="button"
                disabled={isResponding}
                onClick={() => submitFeedback(feedback, FEEDBACK_LABELS[feedback])}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 ${
                  feedback === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {FEEDBACK_LABELS[feedback]}
              </button>
            ))}
            <button
              type="button"
              disabled={isResponding}
              onClick={onRequestNewPlan}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshCw className="h-4 w-4" />
              换一组训练
            </button>
          </div>
          <label className="sr-only" htmlFor="coach-feedback">
            跟 AI 运动搭子说说刚才的感受
          </label>
          <div className="flex items-end gap-3 rounded-[28px] border border-gray-200 bg-white px-4 py-3 shadow-lg shadow-primary-100/40 transition focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-100">
            <textarea
              id="coach-feedback"
              value={feedbackText}
              disabled={isResponding}
              rows={1}
              onChange={event => setFeedbackText(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (feedbackText.trim() && !isResponding) {
                    submitFeedback('completed', feedbackText);
                  }
                }
              }}
              placeholder="有问题，尽管问"
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2 text-base leading-7 text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-wait"
            />
            <button
              type="submit"
              disabled={isResponding || !feedbackText.trim()}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-950 text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-200"
              aria-label="发送给教练"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">AI 反馈仅供运动参考，疼痛或不适请及时停止训练。</p>
        </div>
      </form>
    </section>
  );
}
