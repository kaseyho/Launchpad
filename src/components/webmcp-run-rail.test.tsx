import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { WebMCPRunRail } from './webmcp-run-rail';

describe('WebMCPRunRail', () => {
  it('explains WebMCP as a shared-page tool workflow', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} toolCount={16} />);

    expect(screen.getByText(/WebMCP control plane/i)).toBeVisible();
    expect(screen.getByText('ChatGPT')).toBeVisible();
    expect(screen.getByText(/16 typed tools/i)).toBeVisible();
    expect(screen.getByText(/This page changes/i)).toBeVisible();
    expect(screen.getByText(/manual preview/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /how it works/i }));
    expect(screen.getByText(/reads the live LaunchPad workspace/i)).toBeVisible();
    expect(screen.getByText(/calls a narrow, typed tool/i)).toBeVisible();
    expect(screen.getByText(/same evidence graph and interface update/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /copy agent prompt/i }));
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

    expect(screen.getByText(/WebMCP control plane/i)).toBeVisible();
    expect(screen.getByText('Connected')).toBeVisible();
    expect(screen.getByText('plan_research')).toBeVisible();
    expect(screen.getByText('Created six research lanes.')).toBeVisible();
  });
});
