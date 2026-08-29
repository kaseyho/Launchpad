'use client';

import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';
import { getLatestAgentEvent } from '../presentation/factory-stages';

export function createAgentPrompt(workspace: FoundryWorkspace) {
  const problem = workspace.problemBrief.problemStatement.trim();
  return problem
    ? `Call research_and_ideate once for this LaunchPad problem: “${problem}”. Then use the read-only WebMCP tools to inspect the final solution and its evidence lineage.`
    : 'Wait for me to enter a problem in LaunchPad, then call research_and_ideate once and inspect the completed evidence-backed solution.';
}

export function WebMCPRunRail({
  workspace,
  ready,
  toolCount,
  researchRun,
}: {
  workspace: FoundryWorkspace;
  ready: boolean;
  toolCount: number;
  researchRun: AutonomousResearchProgress;
}) {
  const latestAgentEvent = getLatestAgentEvent(workspace);
  const [expanded, setExpanded] = useState(false);
  const hasProblem = Boolean(workspace.problemBrief.problemStatement.trim());

  return (
    <aside className="webmcp-dock" aria-label="WebMCP agent run">
      <div className="webmcp-dock-main">
        <div className="webmcp-status" data-connected={ready}>
          <span aria-hidden="true" />
          <div><small>WebMCP / optional agent control</small><strong>{ready ? 'Agent tools connected' : 'Autonomous mode active'}</strong></div>
        </div>
        <div className="webmcp-flow" aria-label="LaunchPad autonomous product flow">
          <span>Your problem</span><i aria-hidden="true">→</i><span>Research run</span><i aria-hidden="true">→</i><strong>Solution + proof</strong>
        </div>
        <div className="webmcp-dock-actions">
          <button type="button" className="webmcp-explain" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide WebMCP' : 'WebMCP details'}
          </button>
        </div>
      </div>

      <div className="webmcp-latest" aria-live="polite">
        <span>{researchRun.phase === 'idle' ? 'Waiting for problem' : researchRun.phase.replace('_', ' ')}</span>
        {latestAgentEvent ? (
          <><code>{latestAgentEvent.toolName}</code><strong>{latestAgentEvent.outputSummary}</strong><small>v{latestAgentEvent.workspaceVersion}</small></>
        ) : (
          <strong>{hasProblem ? researchRun.message : 'The user only needs to submit the problem statement.'}</strong>
        )}
      </div>

      {expanded && (
        <div className="webmcp-explanation">
          <div><span>01</span><strong>One human input</strong><p>The problem statement starts the run.</p></div>
          <div><span>02</span><strong>One agent action</strong><p><code>research_and_ideate</code> runs the factory.</p></div>
          <div><span>03</span><strong>{toolCount} inspectable tools</strong><p>Sources and decisions remain traceable.</p></div>
          <p className="webmcp-distinction"><strong>WebMCP controls and verifies the run.</strong> It adds no user setup.</p>
        </div>
      )}
    </aside>
  );
}
