import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { ActivityDrawer } from './activity-drawer';

describe('ActivityDrawer', () => {
  it('stays out of the page until requested and closes with Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const workspace = createInitialWorkspace();
    const { rerender } = render(
      <ActivityDrawer workspace={workspace} open={false} onClose={onClose} notice="LaunchPad is ready." />,
    );

    expect(screen.queryByRole('dialog', { name: /activity/i })).not.toBeInTheDocument();

    rerender(<ActivityDrawer workspace={workspace} open onClose={onClose} notice="LaunchPad is ready." />);
    expect(screen.getByRole('dialog', { name: /activity/i })).toBeVisible();
    expect(screen.getByRole('dialog', { name: /activity/i })).toHaveAttribute('aria-modal', 'true');

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the complete actor-labelled audit trail', () => {
    const workspace = createInitialWorkspace();
    workspace.activity.push({
      id: 'agent-event',
      actor: 'agent',
      toolName: 'get_foundry_state',
      inputSummary: 'Read current state.',
      outputSummary: 'Workspace is ready for research planning.',
      createdAt: '2026-08-29T00:00:00.000Z',
      workspaceVersion: 1,
      status: 'success',
    });

    render(<ActivityDrawer workspace={workspace} open onClose={() => undefined} notice="Agent inspected the workspace." />);

    expect(screen.getByText('get_foundry_state')).toBeVisible();
    expect(screen.getByText('Workspace is ready for research planning.')).toBeVisible();
    expect(screen.getByText('Agent', { selector: 'span' })).toBeVisible();
    expect(screen.getByText('Agent inspected the workspace.')).toBeVisible();
  });
});
