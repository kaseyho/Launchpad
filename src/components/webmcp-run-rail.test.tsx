import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { createAgentPrompt, WebMCPRunRail } from './webmcp-run-rail';

describe('WebMCPRunRail', () => {
  it('explains that WebMCP uses browser tools without an API key', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} toolCount={16} />);

    expect(screen.getByText(/WebMCP \/ no API key/i)).toBeVisible();
    expect(screen.getByText(/open in a webmcp browser/i)).toBeVisible();
    expect(screen.getByText(/16 typed tools/i)).toBeVisible();
    expect(screen.getByText(/This page changes/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /copy chatgpt instruction/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /how it works/i }));
    expect(screen.getByText(/the page exposes tools/i)).toBeVisible();
    expect(screen.getByText(/your agent operates them/i)).toBeVisible();
    expect(screen.getByText(/no api key to paste/i)).toBeVisible();
  });

  it('creates a problem-specific agent instruction and shows real agent activity', async () => {
    const user = userEvent.setup();
    const workspace = createInitialWorkspace();
    workspace.stage = 'PROBLEM_DEFINED';
    workspace.problemBrief.problemStatement = 'Libraries struggle to match older visitors with accessible digital-skills support.';
    workspace.activity.push({
      id: 'agent-event',
      actor: 'agent',
      toolName: 'plan_research',
      inputSummary: 'Build a plan for the defined problem.',
      outputSummary: 'Created six research lanes.',
      createdAt: '2026-08-29T00:00:00.000Z',
      workspaceVersion: 2,
      status: 'success',
    });

    render(<WebMCPRunRail workspace={workspace} ready toolCount={16} />);

    expect(screen.getByText('Agent connected')).toBeVisible();
    expect(screen.getByText('plan_research')).toBeVisible();
    expect(screen.getByText('Created six research lanes.')).toBeVisible();
    expect(createAgentPrompt(workspace)).toContain(workspace.problemBrief.problemStatement);
    await user.click(screen.getByRole('button', { name: /copy chatgpt instruction/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/prompt copied/i);
  });
});
