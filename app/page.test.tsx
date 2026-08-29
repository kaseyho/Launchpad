import { render, screen } from '@testing-library/react';
import Home from './page';

describe('ProofFoundry first product slice', () => {
  it('shows the research factory, problem brief, operational status, and primary action', () => {
    render(<Home />);

    expect(screen.getByRole('banner')).toHaveTextContent('PROOF//FOUNDRY');
    expect(screen.getByRole('region', { name: /problem brief/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /factory floor/i })).toBeVisible();
    expect(screen.getByText('THE LINE IS EMPTY.')).toBeVisible();
    expect(screen.getByRole('button', { name: /load demo problem/i })).toBeEnabled();
    expect(screen.getByText(/manual mode ready/i)).toBeVisible();
    expect(screen.getByText(/webmcp fallback/i)).toBeVisible();
  });
});
