import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
