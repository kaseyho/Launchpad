'use client';

import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import { getLatestAgentEvent } from '../presentation/factory-stages';

export function createAgentPrompt(workspace: FoundryWorkspace) {
  const problem = workspace.problemBrief.problemStatement.trim();
  if (!problem) {
    return 'Wait for me to enter my problem in LaunchPad, then call get_foundry_state and help me turn it into an evidence-backed idea using the page’s WebMCP tools.';
  }
  return `Use the WebMCP tools registered by LaunchPad on this page to work on my problem: “${problem}” Start with get_foundry_state so you use my saved brief. Plan research for this exact problem, find relevant evidence with your browser capabilities, import citation-ready sources or exact excerpts into LaunchPad, and keep every finding visible for my review. Generate problem-specific candidates, stress-test the strongest one, and finalize a blueprint. Pause before accepting, rejecting, or excluding evidence so I control those judgments.`;
}

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
  const hasProblem = Boolean(workspace.problemBrief.problemStatement.trim());

  const onCopy = async () => {
    try {
      await copyText(createAgentPrompt(workspace));
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
          <div><small>WebMCP / no API key</small><strong>{ready ? 'Agent connected' : 'Open in a WebMCP browser'}</strong></div>
        </div>
        <div className="webmcp-flow" aria-label="ChatGPT uses WebMCP tools to update this workspace">
          <span>Your problem</span><i aria-hidden="true">→</i><span>{toolCount} typed tools</span><i aria-hidden="true">→</i><strong>This page changes</strong>
        </div>
        <div className="webmcp-dock-actions">
          <button type="button" className="webmcp-copy" onClick={onCopy} disabled={!hasProblem}>Copy ChatGPT instruction</button>
          <button type="button" className="webmcp-explain" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide explanation' : 'How it works'}
          </button>
        </div>
      </div>

      <div className="webmcp-latest" aria-live="polite">
        <span>{hasProblem ? 'Latest agent action' : 'Waiting for your problem'}</span>
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
          <div><span>01</span><strong>You define the problem</strong><p>Your statement is saved in this live workspace.</p></div>
          <div><span>02</span><strong>The page exposes tools</strong><p>LaunchPad registers {toolCount} narrow actions with the browser through WebMCP.</p></div>
          <div><span>03</span><strong>Your agent operates them</strong><p>ChatGPT reads the brief, calls tools, and changes the same evidence graph you see.</p></div>
          <p className="webmcp-distinction"><strong>No API key to paste.</strong> WebMCP uses the agent session and permission controls in your supported browser. LaunchPad never receives your ChatGPT credentials.</p>
        </div>
      )}
    </aside>
  );
}
