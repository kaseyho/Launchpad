import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { createAgentPrompt, WebMCPRunRail } from './webmcp-run-rail';

const idleRun = { phase: 'idle' as const, progress: 0, message: 'Waiting for your problem statement.' };

describe('WebMCPRunRail', () => {
  it('makes the WebMCP value and browser tool flow obvious without expanding details', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} toolCount={17} researchRun={idleRun} />);

    expect(screen.getByText(/webmcp \/ browser agent bridge/i)).toBeVisible();
    expect(screen.getByText(/manual demo mode/i)).toBeVisible();
    expect(screen.getByRole('heading', { name: /the agent calls launchpad/i })).toBeVisible();
    expect(screen.getByText('01 / Browser agent')).toBeVisible();
    expect(screen.getByText('02 / Typed WebMCP tool')).toBeVisible();
    expect(screen.getByText('03 / Same live page')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /how webmcp works/i }));
    expect(screen.getByText(/registered/i)).toBeVisible();
    expect(screen.getByText(/discovered/i)).toBeVisible();
    expect(screen.getByText(/invoked/i)).toBeVisible();
    expect(screen.getByText(/page updated/i)).toBeVisible();
    expect(screen.getByText(/result returned/i)).toBeVisible();
    expect(screen.getByText(/17 typed tools/i)).toBeVisible();
    expect(screen.getByText(/same page, same state/i)).toBeVisible();
  });

  it('creates one high-level agent instruction and shows real agent activity', () => {
    const workspace = createInitialWorkspace();
    workspace.stage = 'PROBLEM_DEFINED';
    workspace.problemBrief.problemStatement = 'Libraries struggle to match older visitors with accessible digital-skills support.';
    workspace.activity.push({
      id: 'agent-event', actor: 'agent', toolName: 'research_and_ideate', inputSummary: 'Run complete research.',
      outputSummary: 'Built the evidence-backed solution.', createdAt: '2026-08-29T00:00:00.000Z', workspaceVersion: 2, status: 'success',
    });

    render(<WebMCPRunRail workspace={workspace} ready toolCount={17} researchRun={{ phase: 'complete', progress: 100, message: 'Ready.' }} />);

    expect(screen.getByText('17 tools registered')).toBeVisible();
    expect(screen.getByText('research_and_ideate')).toBeVisible();
    expect(createAgentPrompt(workspace)).toContain(workspace.problemBrief.problemStatement);
    expect(createAgentPrompt(workspace)).toContain('research_and_ideate');
  });
});
