import { render, screen } from '@testing-library/react';
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

  it('keeps the current station visible when WebGL is unavailable', async () => {
    render(<InteractiveFactory workspace={createInitialWorkspace()} />);

    expect(screen.getByLabelText(/interactive research factory/i)).toBeVisible();
    expect(await screen.findByText(/3d unavailable/i)).toBeVisible();
    const caption = screen.getByText('Source Dock').closest('.factory-caption');
    expect(caption).toHaveTextContent(/Source Dock/);
    expect(caption).toHaveTextContent(/0 sources/);
  });

  it('makes the current workspace station clear without relying on animation', async () => {
    const workspace = createInitialWorkspace();
    workspace.stage = 'CANDIDATES_READY';
    render(<InteractiveFactory workspace={workspace} />);

    await screen.findByText(/3d unavailable/i);
    const caption = screen.getByText('Idea Forge').closest('.factory-caption');
    expect(caption).toHaveTextContent(/Idea Forge/);
    expect(caption).toHaveTextContent(/0 idea candidates/);
  });
});
