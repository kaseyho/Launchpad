import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { WebMCPRunRail } from './webmcp-run-rail';

describe('WebMCPRunRail', () => {
  it('explains WebMCP as a shared-page tool workflow', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} toolCount={16} />);

    expect(screen.getByRole('heading', { name: /WebMCP runs LaunchPad from the page/i })).toBeVisible();
    expect(screen.getByText(/reads the shared workspace/i)).toBeVisible();
    expect(screen.getByText(/calls one of 16 typed tools/i)).toBeVisible();
    expect(screen.getByText(/same page updates/i)).toBeVisible();
    expect(screen.getByText(/manual preview/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /copy demo prompt/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/prompt copied/i);
  });

  it('shows only real agent activity as the latest tool result', () => {
    const workspace = createInitialWorkspace();
    workspace.activity.push({
      id: 'agent-event',
      actor: 'agent',
      toolName: 'plan_research',
      inputSummary: 'Build a plan for the defined activation problem.',
      outputSummary: 'Created six research lanes.',
      createdAt: '2026-08-29T00:00:00.000Z',
      workspaceVersion: 2,
      status: 'success',
    });

    render(<WebMCPRunRail workspace={workspace} ready toolCount={16} />);

    expect(screen.getByText(/WebMCP connected/i)).toBeVisible();
    expect(screen.getByText('plan_research')).toBeVisible();
    expect(screen.getByText('Created six research lanes.')).toBeVisible();
  });
});
