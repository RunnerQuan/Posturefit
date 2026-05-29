import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('shows the check-in bubble and keeps the logo non-interactive', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('训练打卡')).toBeInTheDocument();
    expect(screen.getByText('今日未打卡')).toBeInTheDocument();
    expect(screen.getByText('AI').closest('h1')).toHaveClass('landing-display-font');
    expect(screen.getByText('开始你的体态之旅').closest('button')).toHaveClass('landing-display-font');
    expect(screen.queryByRole('button', { name: /PostureFit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /PostureFit/i })).not.toBeInTheDocument();
  });
});
