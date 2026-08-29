'use client';

import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import { getLatestAgentEvent } from '../presentation/factory-stages';

const DEMO_PROMPT = 'Use LaunchPad on this page to inspect the current workspace, plan the research, gather evidence, review the findings, generate candidates, stress-test the strongest idea, and finalize a blueprint. Pause before excluding evidence so I can review the decision.';

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand?.('copy');
  textarea.remove();
}

export function WebMCPRunRail({
  workspace,
  ready,
  toolCount,
}: {
  workspace: FoundryWorkspace;
  ready: boolean;
  toolCount: number;
}) {
  const latestAgentEvent = getLatestAgentEvent(workspace);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [expanded, setExpanded] = useState(false);

  const onCopy = async () => {
    try {
      await copyText(DEMO_PROMPT);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <aside className="webmcp-dock" aria-label="WebMCP agent run">
      <div className="webmcp-dock-main">
        <div className="webmcp-status" data-connected={ready}>
          <span aria-hidden="true" />
          <div><small>WebMCP control plane</small><strong>{ready ? 'Connected' : 'Manual preview'}</strong></div>
        </div>
        <div className="webmcp-flow" aria-label="ChatGPT uses WebMCP tools to update this workspace">
          <span>ChatGPT</span><i aria-hidden="true">→</i><span>{toolCount} typed tools</span><i aria-hidden="true">→</i><strong>This page changes</strong>
        </div>
        <div className="webmcp-dock-actions">
          <button type="button" className="webmcp-copy" onClick={onCopy}>Copy agent prompt</button>
          <button type="button" className="webmcp-explain" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide explanation' : 'How it works'}
          </button>
        </div>
      </div>

      <div className="webmcp-latest" aria-live="polite">
        <span>Latest agent action</span>
        {latestAgentEvent ? (
          <><code>{latestAgentEvent.toolName}</code><strong>{latestAgentEvent.outputSummary}</strong><small>v{latestAgentEvent.workspaceVersion}</small></>
        ) : (
          <strong>No agent call yet. Manual actions use the same service.</strong>
        )}
        <div className="copy-feedback" role="status">
          {copyState === 'copied' ? 'Prompt copied.' : copyState === 'error' ? 'Copy failed.' : ''}
        </div>
      </div>

      {expanded && (
        <div className="webmcp-explanation">
          <div><span>01</span><strong>Read</strong><p>ChatGPT reads the live LaunchPad workspace.</p></div>
          <div><span>02</span><strong>Act</strong><p>It calls a narrow, typed tool—not a simulated chat command.</p></div>
          <div><span>03</span><strong>Verify</strong><p>The same evidence graph and interface update for you to inspect.</p></div>
          <p className="webmcp-distinction">One shared state. Inspectable actions. Human override stays available.</p>
        </div>
      )}
    </aside>
  );
}

export { DEMO_PROMPT };
