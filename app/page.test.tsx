import { render, screen } from '@testing-library/react';
import Home from './page';

describe('LaunchPad first product slice', () => {
  it('shows the launch brief, interactive factory, WebMCP run rail, and primary action', () => {
    render(<Home />);

    expect(screen.getByRole('banner')).toHaveTextContent('LaunchPad');
    expect(screen.getByRole('region', { name: /problem brief/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /webmcp runs launchpad from the page/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /load demo problem/i })).toBeEnabled();
    expect(screen.getByText(/manual preview/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /activity/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
