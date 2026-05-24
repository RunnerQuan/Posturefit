import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, Flame, RefreshCw, SendHorizontal, Timer } from 'lucide-react';
import { formatDuration } from '../../lib/time';
import coachAvatar from '../../../assets/coach_profile_photo.png';
import userAvatar from '../../../assets/user_profile_photo.png';
import type { CheckInFeedback, CoachMessage, Exercise, TrainingPlan } from '../../types';
import { MarkdownMessage } from './MarkdownMessage';
import { extractExercisesFromMessage, stripExerciseBlock } from './exerciseBlock';

type CoachChatProps = {
  messages: CoachMessage[];
  plan?: TrainingPlan;
  isResponding: boolean;
  onFeedback: (feedback: CheckInFeedback, feedbackText?: string) => void;
  onRequestNewPlan: () => void;
};

const FEEDBACK_LABELS: Record<CheckInFeedback, string> = {
  completed: '做完了',
  tooTired: '太累了',
};

const AVATAR_SIZE_CLASS = 'h-14 w-14';

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

export function CoachChat({ messages, plan, isResponding, onFeedback, onRequestNewPlan }: CoachChatProps) {
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
    <section className="mx-auto flex h-[calc(100vh-10.5rem)] min-h-[600px] w-full flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-soft backdrop-blur-md">
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth border border-white/40 bg-white/70 px-5 py-5 backdrop-blur-sm custom-scrollbar"
        aria-live="polite"
      >
        {messages.map(message => {
          const isUser = message.role === 'user';
          const isStreamingDraft = !isUser && !message.content && isResponding;
          const messageExercises = isUser ? [] : extractExercisesFromMessage(message.content, plan?.primaryIssue ?? null);
          return (
            <div key={message.id} className={`mx-auto flex w-full max-w-4xl gap-4 py-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className={`mt-1 ${AVATAR_SIZE_CLASS} shrink-0 overflow-hidden rounded-full border border-white/80 bg-blush-50 shadow-sm`}>
                  <img src={coachAvatar} alt="" className="h-full w-full object-cover" />
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
                    AI 教练正在快马加鞭地赶来...
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
                <div className={`mt-1 ${AVATAR_SIZE_CLASS} shrink-0 overflow-hidden rounded-full border border-white/80 bg-emerald-50 shadow-sm`}>
                  <img src={userAvatar} alt="" className="h-full w-full object-cover" />
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
          <div className="mb-3 grid gap-2 rounded-[26px] border border-blush-100/70 bg-gradient-to-r from-blush-50/80 via-white to-mist-50/80 p-2 shadow-sm md:grid-cols-3">
            <button
              type="button"
              disabled={isResponding}
              onClick={() => submitFeedback('completed', FEEDBACK_LABELS.completed)}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-70"
            >
              <CheckCircle2 className="h-4 w-4" />
              做完了
            </button>
            <button
              type="button"
              disabled={isResponding}
              onClick={() => submitFeedback('tooTired', FEEDBACK_LABELS.tooTired)}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70"
            >
              <Flame className="h-4 w-4" />
              太累了
            </button>
            <button
              type="button"
              disabled={isResponding}
              onClick={onRequestNewPlan}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blush-500 to-mist-500 px-4 py-2.5 text-sm font-semibold text-white shadow-bubble transition hover:from-blush-600 hover:to-mist-600 disabled:cursor-wait disabled:opacity-70"
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
