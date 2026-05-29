import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Flame, RefreshCw, SendHorizontal, Timer } from 'lucide-react';
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
  className?: string;
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
        <a
          key={`${exercise.id}-${index}`}
          href={exercise.bilibiliSearchUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_38%)] opacity-80 transition duration-300 group-hover:scale-105" />
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-primary-600">动作 {index + 1}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 transition group-hover:bg-primary-100">
                <Timer className="h-3.5 w-3.5" />
                {formatDuration(exercise.durationSeconds)}
              </span>
            </div>
            <h3 className="mt-2 text-base font-semibold leading-6 text-gray-900 transition group-hover:text-primary-700">
              {exercise.name}
            </h3>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-600">{exercise.description}</p>
            <div className="mt-4 flex items-center justify-between gap-2 text-xs font-medium text-gray-600">
              <span className="text-primary-700/80">点击卡片查看视频</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 transition group-hover:bg-primary-50 group-hover:text-primary-700">
                视频
                <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export function CoachChat({ messages, plan, isResponding, onFeedback, onRequestNewPlan, className = '' }: CoachChatProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollEnabledRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const setAutoScrollEnabled = (enabled: boolean) => {
    autoScrollEnabledRef.current = enabled;
  };

  const isPageNearBottom = () => {
    if (typeof window === 'undefined') {
      return true;
    }
    const pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight || window.innerHeight;
    return window.scrollY + window.innerHeight >= pageHeight - 80;
  };

  const syncScrollControls = (container: HTMLDivElement | null = scrollContainerRef.current) => {
    const containerAwayFromTop = container ? container.scrollTop > 160 : false;
    const pageAwayFromTop = typeof window !== 'undefined' ? window.scrollY > 160 : false;
    const containerNearBottom = container
      ? container.scrollHeight - container.clientHeight - container.scrollTop <= 80
      : true;
    const pageNearBottom = isPageNearBottom();

    setAutoScrollEnabled(containerNearBottom && pageNearBottom);
    setShowScrollToBottom(!containerNearBottom || !pageNearBottom);
    setShowScrollToTop(containerAwayFromTop || pageAwayFromTop);
  };

  const updateScrollState = (container: HTMLDivElement) => {
    const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    const containerNearBottom = distanceFromBottom <= 80;
    const pageNearBottom = isPageNearBottom();
    setAutoScrollEnabled(containerNearBottom && pageNearBottom);
    setShowScrollToBottom(!containerNearBottom || !pageNearBottom);
    setShowScrollToTop(container.scrollTop > 160 || (typeof window !== 'undefined' && window.scrollY > 160));
  };

  const pauseAutoScrollForUserScroll = () => {
    if (!isResponding) {
      return;
    }
    setAutoScrollEnabled(false);
    setShowScrollToBottom(true);
  };

  const setContainerScrollTop = (container: HTMLDivElement, top: number, behavior: ScrollBehavior = 'auto') => {
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top, behavior });
      return;
    }
    container.scrollTop = top;
  };

  const scrollPageTo = (top: number, behavior: ScrollBehavior = 'auto') => {
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') {
      return;
    }
    const maybeMockedScrollTo = window.scrollTo as typeof window.scrollTo & {
      _isMockFunction?: boolean;
      mock?: unknown;
    };
    const isJsdomScrollTo = navigator.userAgent.includes('jsdom')
      && !maybeMockedScrollTo._isMockFunction
      && !maybeMockedScrollTo.mock;
    if (isJsdomScrollTo) {
      return;
    }
    try {
      window.scrollTo({ top, behavior });
    } catch {
      // Some test/webview environments expose scrollTo but do not implement it.
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    setContainerScrollTop(container, container.scrollHeight, behavior);
    scrollPageTo(document.documentElement.scrollHeight, behavior);
    setAutoScrollEnabled(true);
    setShowScrollToBottom(false);
  };

  const scrollToTop = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    setContainerScrollTop(container, 0, 'smooth');
    scrollPageTo(0, 'smooth');
    setAutoScrollEnabled(false);
    setShowScrollToTop(false);
    setShowScrollToBottom(true);
  };

  const submitFeedback = (feedback: CheckInFeedback, text = '') => {
    const normalized = text.trim();
    onFeedback(feedback, normalized || undefined);
    setFeedbackText('');
  };

  useEffect(() => {
    if (!autoScrollEnabledRef.current) {
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    setContainerScrollTop(container, container.scrollHeight, isResponding ? 'auto' : 'smooth');
    if (isResponding && isPageNearBottom()) {
      scrollPageTo(document.documentElement.scrollHeight);
    }
    setShowScrollToBottom(false);
  }, [messages, isResponding]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
    syncScrollControls(container);
  }, []);

  useEffect(() => {
    const handleWindowScroll = () => {
      if (isResponding && !isPageNearBottom()) {
        setAutoScrollEnabled(false);
      }
      syncScrollControls();
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll();
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [isResponding]);

  return (
    <section
      className={`relative mx-auto flex min-h-[calc(100dvh-8rem)] w-full flex-1 flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-soft backdrop-blur-md lg:h-[calc(100vh-10.5rem)] lg:min-h-[600px] ${className}`.trim()}
    >
      <div
        className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-50 flex flex-row items-center gap-2 md:hidden"
        style={{ right: 'max(0.75rem, env(safe-area-inset-right))' }}
      >
        {showScrollToBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/85 bg-white/92 text-blush-700 shadow-soft backdrop-blur-xl transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
            aria-label="移动端查看最新回复"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/85 bg-white/92 text-mist-700 shadow-soft backdrop-blur-xl transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-mist-300"
          aria-label="移动端回到顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={event => updateScrollState(event.currentTarget)}
        onWheel={pauseAutoScrollForUserScroll}
        onTouchMove={pauseAutoScrollForUserScroll}
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth border border-white/40 bg-white/70 px-3 py-4 backdrop-blur-sm custom-scrollbar sm:px-4 lg:px-5 lg:py-5"
        aria-live="polite"
      >
        {messages.map(message => {
          const isUser = message.role === 'user';
          const isStreamingDraft = !isUser && !message.content && isResponding;
          const messageExercises = isUser ? [] : extractExercisesFromMessage(message.content, plan?.primaryIssue ?? null);
          return (
            <div key={message.id} className={`mx-auto flex w-full max-w-4xl gap-2 py-2 sm:gap-3 sm:py-3 lg:gap-4 lg:py-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/80 bg-blush-50 shadow-sm sm:h-12 sm:w-12 lg:h-14 lg:w-14">
                  <img src={coachAvatar} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div
                className={`text-[15px] leading-6 sm:text-base sm:leading-7 ${
                  isUser
                    ? 'chat-liquid-bubble chat-liquid-bubble-user max-w-[84%] rounded-[24px] px-3 py-2 text-gray-950 sm:max-w-[78%] sm:px-4 sm:py-3 lg:max-w-[72%] lg:rounded-[26px] lg:px-5'
                    : 'chat-liquid-bubble max-w-[calc(100%-3rem)] rounded-[24px] px-3 py-2.5 text-gray-900 sm:max-w-[min(900px,calc(100%-3.5rem))] sm:px-4 sm:py-4 lg:max-w-[min(900px,calc(100%-3rem))] lg:rounded-[30px] lg:px-5'
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
                        <MarkdownMessage
                          content={stripExerciseBlock(message.content)}
                          className="text-[15px] leading-6 sm:text-base sm:leading-7"
                        />
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
                <div className="mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/80 bg-emerald-50 shadow-sm sm:h-12 sm:w-12 lg:h-14 lg:w-14">
                  <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showScrollToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="absolute right-4 top-4 z-30 hidden items-center gap-2 rounded-full border border-white/80 bg-white/92 px-3.5 py-2 text-xs font-medium text-mist-700 shadow-soft backdrop-blur-xl transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mist-300 md:inline-flex sm:right-6 sm:px-4 sm:text-sm"
          aria-label="回到顶部"
        >
          <ArrowUp className="h-4 w-4" />
          回到顶部
        </button>
      )}

      {showScrollToBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-[18rem] right-5 z-30 hidden items-center gap-2 rounded-full border border-white/80 bg-white/92 px-4 py-2 text-sm font-medium text-blush-700 shadow-soft backdrop-blur-xl transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300 md:bottom-28 md:right-6 md:inline-flex"
          aria-label="回到底部查看最新回复"
        >
          <ArrowDown className="h-4 w-4" />
          查看最新回复
        </button>
      )}

      <form
        className="sticky bottom-0 z-20 rounded-b-[32px] border-t border-white/30 bg-white/90 backdrop-blur-xl px-3 py-3 sm:px-4 lg:px-5 lg:py-4"
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
