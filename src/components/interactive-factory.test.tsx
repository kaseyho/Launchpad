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
    render(<InteractiveFactory
      workspace={createInitialWorkspace()}
      researchRun={{ phase: 'idle', progress: 0, message: 'Waiting for your problem statement.' }}
    />);

    expect(screen.getByLabelText(/interactive research factory/i)).toBeVisible();
    expect(await screen.findByText(/3d unavailable/i)).toBeVisible();
    expect(screen.getByText('Input open')).toBeVisible();
    expect(screen.getByText('Intake gate')).toBeVisible();
    expect(screen.getByText('Output empty')).toBeVisible();
  });

  it('makes the input, current station, and output clear without relying on animation', async () => {
    const workspace = createInitialWorkspace();
    workspace.problemBrief.problemStatement = 'Restaurant managers cannot deliver consistent first-week training.';
    render(<InteractiveFactory
      workspace={workspace}
      researchRun={{ phase: 'ideating', progress: 82, message: 'Building one solution.' }}
    />);

    await screen.findByText(/3d unavailable/i);
    const console = screen.getByText('Idea forge').closest('.factory-production-console');
    expect(console).toHaveTextContent(/problem received/i);
    expect(console).toHaveTextContent(/building output/i);
    expect(console).toHaveTextContent(/82%/i);
  });

  it('offers restrained motion controls and credits the supplied document asset', async () => {
    const workspace = createInitialWorkspace();
    workspace.problemBrief.problemStatement = 'Restaurant managers cannot deliver consistent first-week training.';
    const { container } = render(<InteractiveFactory
      workspace={workspace}
      researchRun={{ phase: 'complete', progress: 100, message: 'Solution ready.' }}
    />);

    await screen.findByText(/3d unavailable/i);
    expect(screen.getByRole('button', { name: /replay flow/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /pause motion/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /reset view/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /document model credit/i })).toHaveAttribute(
      'href',
      'https://sketchfab.com/3d-models/diplomascroll3dmodeldoerlorenz-416cd723010c4a09ab971ec0225636b4',
    );
    expect(container.querySelector('.factory-port')).toBeNull();
  });
});
