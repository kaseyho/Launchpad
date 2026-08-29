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

  const onCopy = async () => {
    try {
      await copyText(DEMO_PROMPT);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <aside className="webmcp-rail" aria-label="WebMCP agent run">
      <div className="webmcp-rail-header">
        <div className="webmcp-status" data-connected={ready}>
          <span aria-hidden="true" />
          {ready ? 'WebMCP connected' : 'Manual preview'}
        </div>
        <span>{toolCount} typed tools</span>
      </div>

      <div className="webmcp-rail-intro">
        <span className="section-kicker">Why WebMCP</span>
        <h2>WebMCP runs LaunchPad from the page.</h2>
        <p>It gives your agent narrow, inspectable actions inside the same workspace you are watching.</p>
      </div>

      <ol className="webmcp-steps">
        <li><span>1</span><div><strong>Read</strong><p>The agent reads the shared workspace and its current stage.</p></div></li>
        <li><span>2</span><div><strong>Act</strong><p>It calls one of {toolCount} typed tools with explicit side effects.</p></div></li>
        <li><span>3</span><div><strong>Verify</strong><p>The same page updates, so you can inspect or correct the result.</p></div></li>
      </ol>

      <div className="webmcp-proof">
        <span>Latest agent action</span>
        {latestAgentEvent ? (
          <div className="webmcp-event" data-status={latestAgentEvent.status}>
            <code>{latestAgentEvent.toolName}</code>
            <p>{latestAgentEvent.outputSummary}</p>
            <small>Workspace v{latestAgentEvent.workspaceVersion}</small>
          </div>
        ) : (
          <p className="webmcp-waiting">No agent call yet. Manual actions still use the same underlying service.</p>
        )}
      </div>

      <div className="webmcp-prompt">
        <p><strong>Demo it:</strong> ask ChatGPT to operate the research flow while you watch the factory and audit trail change.</p>
        <button type="button" onClick={onCopy}>Copy demo prompt</button>
        <div className="copy-feedback" role="status" aria-live="polite">
          {copyState === 'copied' ? 'Prompt copied.' : copyState === 'error' ? 'Copy failed. Select the prompt manually.' : ''}
        </div>
      </div>

      <div className="webmcp-distinction">
        <span>No pasted chatbot</span>
        <span>No parallel demo state</span>
      </div>
    </aside>
  );
}

export { DEMO_PROMPT };
