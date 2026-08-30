'use client';

import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';
import { getLatestAgentEvent } from '../presentation/factory-stages';

export function createAgentPrompt(workspace: FoundryWorkspace) {
  const problem = workspace.problemBrief.problemStatement.trim();
  return problem
    ? `Call research_and_ideate once for this LaunchPad problem: “${problem}”. Then use the read-only WebMCP tools to inspect the solution and its sources.`
    : 'Wait for me to enter a problem in LaunchPad, then call research_and_ideate once and inspect the finished solution and sources.';
}

type LiveNodeState = 'idle' | 'active' | 'complete' | 'error';

const phaseLabels: Record<AutonomousResearchProgress['phase'], string> = {
  idle: 'Waiting',
  planning: 'Plan research',
  searching: 'Search sources',
  extracting: 'Read studies',
  synthesizing: 'Group findings',
  ideating: 'Build solution',
  stress_testing: 'Check risks',
  complete: 'Solution ready',
  error: 'Run stopped',
};

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
  const currentTool = latestAgentEvent?.toolName ?? 'research_and_ideate';
  const isAgentRun = researchRun.actor === 'agent';
  const agentSeen = isAgentRun || Boolean(latestAgentEvent);
  const runActive = isAgentRun && !['idle', 'complete', 'error'].includes(researchRun.phase);
  const runFailed = isAgentRun && researchRun.phase === 'error';
  const pageUpdated = agentSeen && workspace.stage === 'FINALIZED';
  const agentState: LiveNodeState = agentSeen ? 'complete' : 'idle';
  const toolState: LiveNodeState = runFailed ? 'error' : runActive ? 'active' : agentSeen ? 'complete' : 'idle';
  const pageState: LiveNodeState = runFailed ? 'error' : runActive ? 'active' : pageUpdated ? 'complete' : 'idle';
  const toolStatus = toolState === 'active' ? 'Running' : toolState === 'complete' ? 'Complete' : toolState === 'error' ? 'Stopped' : 'Waiting';
  const pageStatus = pageState === 'active' ? 'Updating' : pageState === 'complete' ? 'Updated' : pageState === 'error' ? 'Stopped' : 'Ready';
  const liveStatus = runActive
    ? `${phaseLabels[researchRun.phase]} · ${researchRun.progress}%`
    : pageUpdated
      ? 'The agent updated the solution on this page.'
      : latestAgentEvent
        ? `Last agent call: ${latestAgentEvent.toolName}`
        : ready
          ? 'Waiting for a browser agent to call a tool.'
          : 'WebMCP not detected here. Manual research still works.';

  return (
    <aside className="webmcp-dock" aria-label="WebMCP agent run" data-connected={ready}>
      <div className="webmcp-proof-header">
        <div className="webmcp-status" data-connected={ready}>
          <span aria-hidden="true" />
          <div><small>WebMCP / live tool activity</small><strong>{ready ? `${toolCount} tools registered` : 'Not detected'}</strong></div>
        </div>
        <div className="webmcp-dock-actions">
          <button type="button" className="webmcp-explain" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide WebMCP details' : 'Show WebMCP details'}
          </button>
        </div>
      </div>

      <section className="webmcp-live-map" role="region" aria-label="Live WebMCP activity">
        <div className="webmcp-map-status">
          <span>Live WebMCP activity</span>
          <strong aria-live="polite">{liveStatus}</strong>
        </div>
        <ol className="webmcp-node-path">
          <li className="webmcp-node" data-state={agentState} aria-label={`Browser agent: ${agentSeen ? 'connected' : 'waiting'}`}>
            <span aria-hidden="true">01</span><div><small>Browser agent</small><strong>{agentSeen ? 'Connected' : 'Waiting'}</strong></div>
          </li>
          <li className="webmcp-link" data-state={toolState} aria-hidden="true"><i /></li>
          <li className="webmcp-node webmcp-tool-node" data-state={toolState} aria-label={`WebMCP tool: ${toolStatus.toLowerCase()}`}>
            <span aria-hidden="true">02</span><div><small>WebMCP tool</small><code>{currentTool}</code></div>
          </li>
          <li className="webmcp-link" data-state={pageState} aria-hidden="true"><i /></li>
          <li className="webmcp-node" data-state={pageState} aria-label={`LaunchPad page: ${pageStatus.toLowerCase()}`}>
            <span aria-hidden="true">03</span><div><small>LaunchPad page</small><strong>{pageStatus}</strong></div>
          </li>
        </ol>
        <div className="webmcp-map-readout">
          <strong>{phaseLabels[researchRun.phase]}</strong>
          <span>{toolCount} tools available</span>
          <span>Page v{workspace.version}</span>
        </div>
      </section>

      {expanded && (
        <div className="webmcp-explanation">
          <ol className="webmcp-lifecycle" aria-label="Official WebMCP tool lifecycle">
            <li><span>01</span><strong>Registered</strong></li>
            <li><span>02</span><strong>Called</strong></li>
            <li><span>03</span><strong>Page updated</strong></li>
          </ol>
          <div className="webmcp-toolset">
            <span>{toolCount} tools available</span>
            <strong>Research · inspect · export</strong>
            <p>Only calls marked as <b>Agent</b> count as WebMCP activity. Manual runs are kept separate.</p>
          </div>
        </div>
      )}
    </aside>
  );
}
