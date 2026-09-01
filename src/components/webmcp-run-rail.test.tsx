import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { createAgentPrompt, WebMCPRunRail } from './webmcp-run-rail';

const idleRun = { phase: 'idle' as const, progress: 0, message: 'Waiting for your problem statement.' };

describe('WebMCPRunRail', () => {
  it('leads with the connected evidence mission rather than a tool-count pitch', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready={false} toolCount={3} toolNames={['get_foundry_state', 'research_and_ideate', 'update_problem_brief']} researchRun={idleRun} />);

    expect(screen.getByText(/browser evidence mission/i)).toBeVisible();
    expect(screen.getByText(/live context/i)).toBeVisible();
    expect(screen.getByText(/close gaps/i)).toBeVisible();
    expect(screen.getByText(/test policy/i)).toBeVisible();
    expect(screen.getByText(/trace proof/i)).toBeVisible();
    expect(screen.queryByText(/optional agent control/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show judge mission/i }));
    expect(screen.getByRole('button', { name: /copy judge prompt/i })).toBeVisible();
    expect(screen.getByText('get_foundry_state')).toBeVisible();
    expect(screen.queryByText(/3 tools preserve proof/i)).not.toBeInTheDocument();
  });

  it('creates one high-level agent instruction and shows real agent activity', () => {
    const workspace = createInitialWorkspace();
    workspace.stage = 'PROBLEM_DEFINED';
    workspace.problemBrief.problemStatement = 'Libraries struggle to match older visitors with accessible digital-skills support.';
    workspace.activity.push({
      id: 'agent-event', actor: 'agent', toolName: 'research_and_ideate', inputSummary: 'Run complete research.',
      outputSummary: 'Built the evidence-backed solution.', createdAt: '2026-08-29T00:00:00.000Z', workspaceVersion: 2, status: 'success',
    });

    workspace.version = 2;
    render(<WebMCPRunRail workspace={workspace} ready toolCount={4} toolNames={['get_foundry_state', 'get_evidence_gaps', 'compare_evidence_policy', 'trace_evidence']} researchRun={{ phase: 'complete', progress: 100, message: 'Ready.' }} />);

    expect(screen.getByText('Connected to this workspace')).toBeVisible();
    expect(screen.getByText('research_and_ideate')).toBeVisible();
    expect(screen.getByText(/v1 → v2/i)).toBeVisible();
    expect(createAgentPrompt(workspace)).toContain(workspace.problemBrief.problemStatement);
    expect(createAgentPrompt(workspace)).toContain('get_evidence_gaps');
    expect(createAgentPrompt(workspace)).toContain('compare_evidence_policy');
  });

  it('copies the exact judge prompt and confirms it visibly', async () => {
    const user = userEvent.setup();
    render(<WebMCPRunRail workspace={createInitialWorkspace()} ready toolCount={3} toolNames={['get_foundry_state']} researchRun={idleRun} />);
    await user.click(screen.getByRole('button', { name: /show judge mission/i }));
    await user.click(screen.getByRole('button', { name: /copy judge prompt/i }));
    expect(screen.getByText(/judge prompt copied/i)).toBeVisible();
  });

  it('shows the latest counterfactual recommendation delta on the visible rail', () => {
    render(<WebMCPRunRail
      workspace={createInitialWorkspace()}
      ready
      toolCount={3}
      toolNames={['compare_evidence_policy']}
      researchRun={idleRun}
      policyComparison={{
        baselinePolicy: { minimumCorroboration: 1, includePrivate: true },
        proposedPolicy: { minimumCorroboration: 2, includePrivate: false },
        baselineRanking: [{ candidateId: 'candidate-a', score: 92, coverage: 100 }],
        proposedRanking: [{ candidateId: 'candidate-b', score: 81, coverage: 75 }],
        recommendationChanged: true,
        eligibleFindingIds: ['finding-a'],
        excludedFindingIds: ['finding-b'],
      }}
    />);

    expect(screen.getByText(/policy changed the leader/i)).toBeVisible();
    expect(screen.getByText(/candidate-a.*candidate-b/i)).toBeVisible();
    expect(screen.getByText(/1 finding excluded/i)).toBeVisible();
  });
});
