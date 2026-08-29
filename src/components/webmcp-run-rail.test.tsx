import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { createAgentPrompt, WebMCPRunRail } from './webmcp-run-rail';

const idleRun = { phase: 'idle' as const, progress: 0, message: 'Waiting for your problem statement.' };

describe('WebMCPRunRail', () => {
  it('keeps WebMCP optional and explains the one-shot agent control layer', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} toolCount={17} researchRun={idleRun} />);

    expect(screen.getByText(/webmcp \/ optional agent control/i)).toBeVisible();
    expect(screen.getByText(/solution \+ proof/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /webmcp details/i }));
    expect(screen.getByText(/one human input/i)).toBeVisible();
    expect(screen.getByText(/research_and_ideate/i)).toBeVisible();
    expect(screen.getByText(/17 inspectable tools/i)).toBeVisible();
    expect(screen.getByText(/adds no user setup/i)).toBeVisible();
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

    expect(screen.getByText('Agent tools connected')).toBeVisible();
    expect(screen.getByText('research_and_ideate')).toBeVisible();
    expect(createAgentPrompt(workspace)).toContain(workspace.problemBrief.problemStatement);
    expect(createAgentPrompt(workspace)).toContain('research_and_ideate');
  });
});
