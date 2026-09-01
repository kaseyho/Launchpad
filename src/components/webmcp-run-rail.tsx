'use client';

import { useState } from 'react';
import type { EvidencePolicyComparison, FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';
import type { AgentConsentRequest } from './agent-consent-dialog';
import { getLatestAgentEvent } from '../presentation/factory-stages';

export function createAgentPrompt(workspace: FoundryWorkspace) {
  const problem = workspace.problemBrief.problemStatement.trim();
  const context = problem
    ? `Work from the live LaunchPad problem: “${problem}”.`
    : 'Work from the problem I enter in this live LaunchPad page; do not invent missing context.';
  return `${context} Read get_foundry_state first. Use browser research to find relevant public evidence and counter-evidence, then add it with ingest_evidence_batch including truthful provenance, retrieval time, and privacy scope. Call get_evidence_gaps and close the most important gap. Use compare_evidence_policy to show whether stricter source, recency, geography, corroboration, or privacy rules change the recommendation; apply a policy only when useful. Trace one recommendation component to its original source with trace_evidence. Preview finalization or export before committing, and stop for the visible human-consent checkpoint whenever LaunchPad requests it. Report the exact tool sequence and workspace-version transitions.`;
}

export function WebMCPRunRail({
  workspace,
  ready,
  toolNames = [],
  researchRun,
  error,
  pendingConsent,
  policyComparison,
}: {
  workspace: FoundryWorkspace;
  ready: boolean;
  toolCount: number;
  toolNames?: string[];
  researchRun: AutonomousResearchProgress;
  error?: string;
  pendingConsent?: AgentConsentRequest;
  policyComparison?: EvidencePolicyComparison;
}) {
  const latestAgentEvent = getLatestAgentEvent(workspace);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const prompt = createAgentPrompt(workspace);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard?.writeText(prompt);
    } finally {
      setCopied(true);
    }
  };

  return (
    <aside className="webmcp-dock" aria-label="WebMCP agent run">
      <div className="webmcp-dock-main">
        <div className="webmcp-status" data-connected={ready}>
          <span aria-hidden="true" />
          <div>
            <small>WebMCP browser evidence mission</small>
            <strong>{error ? 'Connection needs attention' : ready ? 'Connected to this workspace' : 'Waiting for a WebMCP browser'}</strong>
          </div>
        </div>
        <div className="webmcp-flow" aria-label="WebMCP evidence mission">
          <span>Live context</span><i aria-hidden="true">→</i>
          <span>Close gaps</span><i aria-hidden="true">→</i>
          <span>Test policy</span><i aria-hidden="true">→</i>
          <strong>Trace proof</strong>
        </div>
        <div className="webmcp-dock-actions">
          <button type="button" className="webmcp-explain" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide judge mission' : 'Show judge mission'}
          </button>
        </div>
      </div>

      <div className="webmcp-latest" aria-live="polite">
        <span>{pendingConsent
          ? 'Human approval required'
          : latestAgentEvent
            ? latestAgentEvent.status === 'success' ? 'Receipt' : 'Action needs recovery'
            : researchRun.phase === 'idle' ? 'Mission ready' : researchRun.phase.replace('_', ' ')}</span>
        {latestAgentEvent ? (
          <><code>{latestAgentEvent.toolName}</code><strong>{latestAgentEvent.outputSummary}</strong><small>v{Math.max(1, latestAgentEvent.workspaceVersion - 1)} → v{latestAgentEvent.workspaceVersion}</small></>
        ) : (
          <strong>{error ?? 'The browser agent sees the same state, gaps, policy, and proof as the person.'}</strong>
        )}
      </div>

      {policyComparison && (
        <div className="webmcp-policy-delta" aria-live="polite">
          <span>{policyComparison.recommendationChanged ? 'Policy changed the leader' : 'Policy kept the leader'}</span>
          <strong>{policyComparison.baselineRanking[0]?.candidateId ?? 'No ranked candidate'} → {policyComparison.proposedRanking[0]?.candidateId ?? 'No eligible candidate'}</strong>
          <small>{policyComparison.excludedFindingIds.length} finding{policyComparison.excludedFindingIds.length === 1 ? '' : 's'} excluded · comparison only</small>
        </div>
      )}

      {expanded && (
        <div className="webmcp-explanation">
          <div className="webmcp-mission-copy">
            <span>Judge prompt</span>
            <p>{prompt}</p>
            <button type="button" onClick={() => void copyPrompt()}>Copy judge prompt</button>
            <small aria-live="polite">{copied ? 'Judge prompt copied.' : 'Paste into a connected WebMCP browser agent.'}</small>
          </div>
          <div className="webmcp-active-tools">
            <span>Tools available at {workspace.stage.toLowerCase().replaceAll('_', ' ')}</span>
            <p>{toolNames.map((name) => <code key={name}>{name}</code>)}</p>
          </div>
          <p className="webmcp-distinction"><strong>The proof is the interaction.</strong> Browser-found evidence visibly enters this page, gap checks direct the next move, policies can change the ranking without deleting evidence, and sensitive commits stop for a human.</p>
        </div>
      )}
    </aside>
  );
}
