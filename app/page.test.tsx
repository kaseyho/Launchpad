import { render, screen } from '@testing-library/react';
import Home from './page';

describe('LaunchPad first product slice', () => {
  it('shows the launch brief, interactive factory, WebMCP control strip, and primary action', async () => {
    render(<Home />);

    await screen.findByText(/3d unavailable/i);
    expect(screen.getByRole('banner')).toHaveTextContent('LaunchPad');
    expect(screen.getByRole('region', { name: /problem brief/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toBeVisible();
    expect(screen.getByRole('complementary', { name: /webmcp agent run/i })).toHaveTextContent(/This page changes/);
    expect(screen.getByRole('button', { name: /load demo problem/i })).toBeEnabled();
    expect(screen.getByText(/manual preview/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /activity/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
