import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { createAgentPrompt, WebMCPRunRail } from './webmcp-run-rail';

const idleRun = { phase: 'idle' as const, progress: 0, message: 'Waiting for your problem statement.' };

describe('WebMCPRunRail', () => {
  it('shows a visual tool path without presenting a manual run as WebMCP activity', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} toolCount={17} researchRun={idleRun} />);

    const map = screen.getByRole('region', { name: /live webmcp activity/i });
    expect(map).toBeVisible();
    expect(screen.getByLabelText(/browser agent: waiting/i)).toHaveAttribute('data-state', 'idle');
    expect(screen.getByLabelText(/webmcp tool: waiting/i)).toHaveAttribute('data-state', 'idle');
    expect(screen.getByLabelText(/launchpad page: ready/i)).toHaveAttribute('data-state', 'idle');
    expect(screen.getByText(/webmcp not detected here.*manual research still works/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /show webmcp details/i }));
    expect(screen.getByText(/registered/i)).toBeVisible();
    expect(screen.getByText(/called/i)).toBeVisible();
    expect(screen.getByText(/page updated/i)).toBeVisible();
    expect(screen.getAllByText(/17 tools available/i)).toHaveLength(2);
  });

  it('moves the live nodes as a real browser-agent run progresses', () => {
    const workspace = createInitialWorkspace();
    workspace.stage = 'PROBLEM_DEFINED';
    workspace.problemBrief.problemStatement = 'Libraries struggle to match older visitors with accessible digital-skills support.';
    workspace.activity.push({
      id: 'agent-event', actor: 'agent', toolName: 'research_and_ideate', inputSummary: 'Run complete research.',
      outputSummary: 'Built the evidence-backed solution.', createdAt: '2026-08-29T00:00:00.000Z', workspaceVersion: 2, status: 'success',
    });

    render(<WebMCPRunRail workspace={workspace} ready toolCount={17} researchRun={{ phase: 'searching', progress: 24, message: 'Searching studies.', actor: 'agent' }} />);

    expect(screen.getByText('17 tools registered')).toBeVisible();
    expect(screen.getByText('research_and_ideate')).toBeVisible();
    expect(screen.getByLabelText(/browser agent: connected/i)).toHaveAttribute('data-state', 'complete');
    expect(screen.getByLabelText(/webmcp tool: running/i)).toHaveAttribute('data-state', 'active');
    expect(screen.getByLabelText(/launchpad page: updating/i)).toHaveAttribute('data-state', 'active');
    expect(screen.getAllByText(/search sources/i)).toHaveLength(2);
    expect(createAgentPrompt(workspace)).toContain(workspace.problemBrief.problemStatement);
    expect(createAgentPrompt(workspace)).toContain('research_and_ideate');
  });

  it('locks every node when the agent has updated the solution on the page', () => {
    const workspace = createInitialWorkspace();
    workspace.stage = 'FINALIZED';
    workspace.activity.push({
      id: 'agent-event', actor: 'agent', toolName: 'research_and_ideate', inputSummary: 'Run complete research.',
      outputSummary: 'Solution ready.', createdAt: '2026-08-29T00:00:00.000Z', workspaceVersion: 9, status: 'success',
    });

    render(<WebMCPRunRail workspace={workspace} ready toolCount={17} researchRun={{ phase: 'complete', progress: 100, message: 'Solution ready.', actor: 'agent' }} />);

    expect(screen.getByLabelText(/browser agent: connected/i)).toHaveAttribute('data-state', 'complete');
    expect(screen.getByLabelText(/webmcp tool: complete/i)).toHaveAttribute('data-state', 'complete');
    expect(screen.getByLabelText(/launchpad page: updated/i)).toHaveAttribute('data-state', 'complete');
  });

  it('does not mark the page updated for a read-only agent call', () => {
    const workspace = createInitialWorkspace();
    workspace.activity.push({
      id: 'agent-read', actor: 'agent', toolName: 'get_foundry_state', inputSummary: 'Read current state.',
      outputSummary: 'Returned current state.', createdAt: '2026-08-29T00:00:00.000Z', workspaceVersion: 1, status: 'success',
    });

    render(<WebMCPRunRail workspace={workspace} ready toolCount={17} researchRun={idleRun} />);

    expect(screen.getByLabelText(/browser agent: connected/i)).toHaveAttribute('data-state', 'complete');
    expect(screen.getByLabelText(/webmcp tool: complete/i)).toHaveAttribute('data-state', 'complete');
    expect(screen.getByLabelText(/launchpad page: ready/i)).toHaveAttribute('data-state', 'idle');
  });
});
