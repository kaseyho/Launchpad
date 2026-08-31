'use client';

import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';
import { getLatestAgentEvent } from '../presentation/factory-stages';

export function createAgentPrompt(workspace: FoundryWorkspace) {
  const problem = workspace.problemBrief.problemStatement.trim();
  return problem
    ? `Call research_and_ideate once for this LaunchPad problem: “${problem}”. If the automatic run needs stronger coverage, use browser research or connected sources to find relevant Reddit/community discussions, public market or professional posts, and user-authorized analytics, then import those sources before inspecting the final solution and its evidence lineage.`
    : 'Wait for me to enter a problem in LaunchPad, then call research_and_ideate once. If coverage is thin, find relevant public or user-authorized sources and import them before inspecting the completed evidence-backed solution.';
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
          <div><span>01</span><strong>The user types once</strong><p>The webpage starts the complete research-to-solution run itself.</p></div>
          <div><span>02</span><strong>WebMCP exposes the run</strong><p>A browser agent can start the same one-shot workflow with <code>research_and_ideate</code>.</p></div>
          <div><span>03</span><strong>{toolCount} tools preserve proof</strong><p>The agent can extend coverage with public conversations, professional posts, market signals, or user-authorized analytics, then inspect sources, findings, decisions, and lineage.</p></div>
          <p className="webmcp-distinction"><strong>WebMCP is the control and verification layer.</strong> It is not another task the person must complete. Public web access varies by site; private analytics and signed-in sources must be explicitly connected or imported.</p>
        </div>
      )}
    </aside>
  );
}
