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
    expect(screen.queryByRole('button', { name: /PostureFit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /PostureFit/i })).not.toBeInTheDocument();
  });
});
