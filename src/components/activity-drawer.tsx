'use client';

import { useEffect } from 'react';
import type { FoundryWorkspace } from '../domain/types';

function formatActivityTime(isoTimestamp: string) {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(isoTimestamp));
}

export function ActivityDrawer({
  workspace,
  open,
  onClose,
  notice,
  exportFilename,
  onDownloadExport,
}: {
  workspace: FoundryWorkspace;
  open: boolean;
  onClose: () => void;
  notice: string;
  exportFilename?: string;
  onDownloadExport?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="activity-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside
        className="activity-drawer"
        id="activity-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-title"
        aria-describedby="activity-description"
      >
        <header className="activity-header">
          <div>
            <span>Workspace history</span>
            <h2 id="activity-title">Activity</h2>
            <p id="activity-description">Human, agent, and system actions for page version {workspace.version}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close activity">Close</button>
        </header>

        <div className="activity-current" aria-live="polite">
          <span>Current</span>
          <strong>{notice}</strong>
        </div>

        <ol className="activity-timeline">
          {workspace.activity.slice().reverse().map((event) => (
            <li key={`${event.id}-${event.workspaceVersion}`} data-actor={event.actor} data-status={event.status}>
              <div className="activity-event-meta">
                <span>{event.actor.charAt(0).toUpperCase() + event.actor.slice(1)}</span>
                <time dateTime={event.createdAt}>{formatActivityTime(event.createdAt)} UTC</time>
              </div>
              <code>{event.toolName}</code>
              <p>{event.outputSummary}</p>
              <small>Workspace v{event.workspaceVersion} · {event.status}</small>
            </li>
          ))}
        </ol>

        {workspace.activity.length === 0 && (
          <div className="activity-empty"><strong>No actions yet.</strong><span>Define a problem or invite an agent to begin.</span></div>
        )}

        {exportFilename && onDownloadExport && (
          <button className="activity-export" type="button" onClick={onDownloadExport}>Download {exportFilename}</button>
        )}
      </aside>
    </div>
  );
}
