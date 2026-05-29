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

describe('CoachChat', () => {
  it('shows a scroll-to-bottom button when the user scrolls away from the bottom during streaming', () => {
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
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 1200 });
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 500 });
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 540 });

    fireEvent.scroll(scroller);

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
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 1400 });
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 500 });
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 900 });
    Object.defineProperty(scroller, 'scrollTo', { configurable: true, value: scrollTo });
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
