import { useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, RefreshCw, RotateCcw, SendHorizontal, Timer, UserRound } from 'lucide-react';
import { formatDuration } from '../../lib/time';
import type { CheckInFeedback, CoachMessage, Exercise, TrainingPlan } from '../../types';
import { MarkdownMessage } from './MarkdownMessage';
import { extractExercisesFromMessage, stripExerciseBlock } from './exerciseBlock';

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

function ExerciseCards({ exercises }: { exercises: Exercise[] }) {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 grid gap-3 rounded-3xl bg-primary-50/50 p-3 md:grid-cols-3">
      {exercises.map((exercise, index) => (
        <article key={`${exercise.id}-${index}`} className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
          <p className="text-xs font-semibold text-primary-600">动作 {index + 1}</p>
          <h3 className="mt-1 text-base font-semibold leading-6 text-gray-900">{exercise.name}</h3>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-600">{exercise.description}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              <Timer className="h-3.5 w-3.5" />
              {formatDuration(exercise.durationSeconds)}
            </span>
            <a
              href={exercise.bilibiliSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:text-primary-700"
            >
              视频
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

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
    <section className="mx-auto w-full max-w-6xl overflow-visible rounded-[32px] border border-white/80 bg-white/90 shadow-soft backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 border-b border-blush-100/50 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-blush-500">AI 陪练</p>
          <h2 className="mt-1 text-2xl font-semibold text-blush-700">
            {plan ? `今天完成 ${plan.exercises.length} 个动作了吗？` : 'AI 教练正在生成今日训练'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blush-50 px-6 py-2.5 text-base font-medium text-blush-600 transition hover:bg-blush-100 border border-blush-100"
        >
          <RotateCcw className="h-4 w-4" />
          重新评估
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        className="scroll-smooth bg-white/70 backdrop-blur-sm border border-white/40 px-5 py-5"
        aria-live="polite"
      >
        {messages.map(message => {
          const isUser = message.role === 'user';
          const isStreamingDraft = !isUser && !message.content && isResponding;
          const messageExercises = isUser ? [] : extractExercisesFromMessage(message.content, plan?.primaryIssue ?? null);
          return (
            <div key={message.id} className={`mx-auto flex w-full max-w-4xl gap-4 py-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blush-200 to-mist-200 text-blush-600">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`text-base leading-7 ${
                  isUser
                    ? 'chat-liquid-bubble chat-liquid-bubble-user max-w-[72%] rounded-[26px] px-5 py-3 text-gray-950'
                    : 'chat-liquid-bubble max-w-[min(900px,calc(100%-3rem))] rounded-[30px] px-5 py-4 text-gray-900'
                }`}
              >
                {isStreamingDraft ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-blush-50/80 backdrop-blur-sm px-4 py-3 text-sm text-blush-500 border border-blush-100/50">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-blush-400 to-mist-400" />
                    正在连接 AI 教练...
                  </div>
                ) : (
                  <div>
                    {isUser ? (
                      <p className="whitespace-pre-line break-words">{message.content}</p>
                    ) : (
                      <>
                        <MarkdownMessage content={stripExerciseBlock(message.content)} />
                        {!isResponding || messages[messages.length - 1]?.id !== message.id ? (
                          <ExerciseCards exercises={messageExercises} />
                        ) : null}
                      </>
                    )}
                    {!isUser && isResponding && messages[messages.length - 1]?.id === message.id && (
                      <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-gradient-to-r from-blush-400 to-mist-400 align-[-2px]" />
                    )}
                  </div>
                )}
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
        className="sticky bottom-0 z-20 rounded-b-[32px] border-t border-white/30 bg-white/80 backdrop-blur-xl px-5 py-4"
        onSubmit={event => {
          event.preventDefault();
          if (!feedbackText.trim() || isResponding) {
            return;
          }
          submitFeedback('completed', feedbackText);
        }}
      >
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(FEEDBACK_LABELS) as CheckInFeedback[]).map(feedback => (
              <button
                key={feedback}
                type="button"
                disabled={isResponding}
                onClick={() => submitFeedback(feedback, FEEDBACK_LABELS[feedback])}
                className={`cursor-pointer rounded-full px-6 py-3 text-base font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 ${
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
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blush-500 to-mist-500 px-6 py-3 text-base font-semibold text-white transition hover:from-blush-600 hover:to-mist-600 disabled:cursor-wait disabled:opacity-70 shadow-bubble"
            >
              <RefreshCw className="h-4 w-4" />
              换一组训练
            </button>
          </div>
          <label className="sr-only" htmlFor="coach-feedback">
            跟 AI 运动搭子说说刚才的感受
          </label>
          <div className="flex items-end gap-3 rounded-[28px] border border-blush-200 bg-white px-4 py-3 shadow-soft transition focus-within:border-blush-300 focus-within:ring-4 focus-within:ring-blush-100/50">
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
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-blush-500 to-mist-500 text-white transition hover:from-blush-600 hover:to-mist-600 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-300 shadow-bubble"
              aria-label="发送给教练"
            >
              <SendHorizontal className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-mist-400">AI 反馈仅供运动参考，疼痛或不适请及时停止训练。</p>
        </div>
      </form>
    </section>
  );
}
