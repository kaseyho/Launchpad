import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { InteractiveFactory } from './interactive-factory';

describe('InteractiveFactory', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers keyboard-equivalent station inspection when WebGL is unavailable', async () => {
    const user = userEvent.setup();
    render(<InteractiveFactory workspace={createInitialWorkspace()} />);

    expect(screen.getByLabelText(/interactive research factory/i)).toBeVisible();
    expect(await screen.findByText(/3d unavailable/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /evidence lab/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Evidence Lab/);
    expect(screen.getByRole('status')).toHaveTextContent(/0 findings/);
    expect(screen.getByRole('button', { name: /evidence lab/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('makes the current workspace station clear without relying on animation', () => {
    const workspace = createInitialWorkspace();
    workspace.stage = 'CANDIDATES_READY';
    render(<InteractiveFactory workspace={workspace} />);

    expect(screen.getByRole('button', { name: /idea forge/i })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('button', { name: /review bay/i })).toHaveAttribute('data-state', 'complete');
    expect(screen.getByRole('button', { name: /stress chamber/i })).toHaveAttribute('data-state', 'idle');
  });
});
