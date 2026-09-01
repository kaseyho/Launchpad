import { render, screen } from '@testing-library/react';
import Home from './page';

describe('LaunchPad first product slice', () => {
  it('shows the launch brief, interactive factory, WebMCP control strip, and primary action', async () => {
    render(<Home />);

    await screen.findByText(/3d unavailable/i);
    expect(screen.getByRole('banner')).toHaveTextContent('LaunchPad');
    expect(screen.getByRole('region', { name: /problem brief/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toBeVisible();
    expect(screen.getByRole('complementary', { name: /webmcp agent run/i })).toHaveTextContent(/browser evidence mission/i);
    expect(screen.getByRole('textbox', { name: /what problem should launchpad solve/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /research this problem/i })).toBeEnabled();
    expect(screen.getByText(/no api key, source hunting, or manual research workflow/i)).toBeVisible();
    expect(screen.getByText(/live context/i)).toBeVisible();
    expect(screen.queryByText(/optional agent control/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activity/i })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /plans/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
