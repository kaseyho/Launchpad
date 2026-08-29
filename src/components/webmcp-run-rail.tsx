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
  const currentTool = latestAgentEvent?.toolName ?? 'research_and_ideate';

  return (
    <aside className="webmcp-dock" aria-label="WebMCP agent run" data-connected={ready}>
      <div className="webmcp-proof-header">
        <div className="webmcp-status" data-connected={ready}>
          <span aria-hidden="true" />
          <div><small>WebMCP / browser agent bridge</small><strong>{ready ? `${toolCount} tools registered` : 'Manual demo mode'}</strong></div>
        </div>
        <div className="webmcp-dock-actions">
          <button type="button" className="webmcp-explain" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide protocol' : 'How WebMCP works'}
          </button>
        </div>
      </div>

      <div className="webmcp-proof-message">
        <span>Why WebMCP</span>
        <h2>The agent calls LaunchPad. You watch the same page change.</h2>
        <p>No screenshot guessing and no duplicate backend state. The agent invokes structured tools that reuse LaunchPad&apos;s live research workflow.</p>
      </div>

      <div className="webmcp-flow" aria-label="WebMCP browser tool flow">
        <div><span>01 / Browser agent</span><strong>Your problem</strong></div>
        <i aria-hidden="true">→</i>
        <div><span>02 / Typed WebMCP tool</span><code>research_and_ideate()</code></div>
        <i aria-hidden="true">→</i>
        <div><span>03 / Same live page</span><strong>Factory + cited report</strong></div>
      </div>

      <div className="webmcp-latest" aria-live="polite">
        <span>{latestAgentEvent ? 'Agent call' : ready ? 'Ready for agent' : 'Browser status'}</span>
        <code>{currentTool}</code>
        {latestAgentEvent ? (
          <><strong>{latestAgentEvent.outputSummary}</strong><small>workspace v{latestAgentEvent.workspaceVersion}</small></>
        ) : (
          <strong>{ready
            ? hasProblem ? researchRun.message : 'A browser agent can discover and call the registered tools now.'
            : 'WebMCP API not detected here. The manual button runs the same page logic for the demo.'}</strong>
        )}
      </div>

      {expanded && (
        <div className="webmcp-explanation">
          <ol className="webmcp-lifecycle" aria-label="Official WebMCP tool lifecycle">
            <li><span>01</span><strong>Registered</strong></li>
            <li><span>02</span><strong>Discovered</strong></li>
            <li><span>03</span><strong>Invoked</strong></li>
            <li><span>04</span><strong>Page updated</strong></li>
            <li><span>05</span><strong>Result returned</strong></li>
          </ol>
          <div className="webmcp-toolset">
            <span>{toolCount} typed tools</span>
            <strong>Run · source · inspect · verify · export</strong>
            <p><b>Same page, same state.</b> Both the form and the agent tools call LaunchPad&apos;s shared service. Only activity marked as an agent call is WebMCP proof.</p>
          </div>
          <p className="webmcp-distinction"><strong>Human stays in control.</strong> The visible workspace, history, sources, and report remain available while the agent works.</p>
        </div>
      )}
    </aside>
  );
}
