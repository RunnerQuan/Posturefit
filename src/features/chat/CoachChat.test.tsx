import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachChat } from './CoachChat';
import type { CoachMessage } from '../../types';

function createMessage(id: string, role: 'user' | 'assistant', content: string): CoachMessage {
  return {
    id,
    role,
    content,
    createdAt: '2026-05-29T00:00:00.000Z',
    source: 'mock',
  };
}

function mockScrollerMetrics(scroller: HTMLDivElement, scrollTo = vi.fn()) {
  Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 1400 });
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 500 });
  Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 520 });
  Object.defineProperty(scroller, 'scrollTo', { configurable: true, value: scrollTo });
  return scrollTo;
}

describe('CoachChat', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 768 });
    vi.restoreAllMocks();
  });

  it('keeps the latest-reply button above the mobile input controls', () => {
    render(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
        ]}
        isResponding
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    const scroller = screen.getByText('第一条消息').closest('[aria-live="polite"]') as HTMLDivElement;
    mockScrollerMetrics(scroller);

    fireEvent.scroll(scroller);

    expect(screen.getByRole('button', { name: '回到底部查看最新回复' })).toHaveClass('bottom-[18rem]');
  });

  it('shows a top button after scrolling down and scrolls smoothly to the top', () => {
    const scrollTo = vi.fn();
    render(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
        ]}
        isResponding={false}
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    const scroller = screen.getByText('第一条消息').closest('[aria-live="polite"]') as HTMLDivElement;
    mockScrollerMetrics(scroller, scrollTo);

    fireEvent.scroll(scroller);
    fireEvent.click(screen.getByRole('button', { name: '回到顶部' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('shows a mobile bottom-centered top arrow when away from the bottom', () => {
    const scrollTo = vi.fn();
    render(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
        ]}
        isResponding={false}
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    const scroller = screen.getByText('第一条消息').closest('[aria-live="polite"]') as HTMLDivElement;
    mockScrollerMetrics(scroller, scrollTo);
    fireEvent.scroll(scroller);
    const mobileTopButton = screen.getByRole('button', { name: '移动端回到顶部' });

    expect(mobileTopButton).toHaveClass('fixed');
    expect(mobileTopButton).toHaveClass('left-1/2');
    expect(mobileTopButton).toHaveClass('bottom-[calc(1.25rem+env(safe-area-inset-bottom))]');

    fireEvent.click(mobileTopButton);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(screen.queryByRole('button', { name: '移动端查看最新回复' })).not.toBeInTheDocument();
  });

  it('shows a top button when the mobile page scrolls down', () => {
    const windowScrollTo = vi.mocked(window.scrollTo);
    windowScrollTo.mockClear();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1500 });

    render(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
        ]}
        isResponding={false}
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole('button', { name: '回到顶部' }));

    expect(windowScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('shows the latest-reply button while streaming when the mobile page is away from the bottom', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1500 });

    render(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
        ]}
        isResponding
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: '回到底部查看最新回复' })).toBeInTheDocument();
  });

  it('shows the latest-reply button when the mobile page is at the top', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1500 });

    render(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
        ]}
        isResponding={false}
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: '回到底部查看最新回复' })).toBeInTheDocument();
  });


  it('does not force-scroll while the user scrolls up during streaming', () => {
    const scrollTo = vi.fn();
    const { rerender } = render(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
        ]}
        isResponding
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    const scroller = screen.getByText('第一条消息').closest('[aria-live="polite"]') as HTMLDivElement;
    mockScrollerMetrics(scroller, scrollTo);
    scrollTo.mockClear();

    fireEvent.wheel(scroller, { deltaY: -120 });

    rerender(
      <CoachChat
        messages={[
          createMessage('a1', 'assistant', '第一条消息'),
          createMessage('a2', 'assistant', '第二条消息'),
          createMessage('a3', 'assistant', '第三条流式消息'),
        ]}
        isResponding
        onFeedback={vi.fn()}
        onRequestNewPlan={vi.fn()}
      />
    );

    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '回到底部查看最新回复' })).toBeInTheDocument();
  });
});
