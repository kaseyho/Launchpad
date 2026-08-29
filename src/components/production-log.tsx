import type { FoundryWorkspace } from '../domain/types';

export function formatActivityTime(isoTimestamp: string) {
  return `${new Date(isoTimestamp).toISOString().slice(11, 19)} UTC`;
}

export function ProductionLog({
  workspace,
  notice,
  exportFilename,
  onDownloadExport,
}: {
  workspace: FoundryWorkspace;
  notice: string;
  exportFilename?: string;
  onDownloadExport?: () => void;
}) {
  const recent = workspace.activity.slice(-3).reverse();
  return (
    <section className="production-log" aria-label="Production log">
      <div className="log-title"><span>PRODUCTION LOG</span><small>AUDIT TRAIL / V{String(workspace.version).padStart(3, '0')}</small></div>
      <div className="log-stream" aria-live="polite">
        {recent.map((event) => (
          <div className="log-entry" key={`${event.id}-${event.workspaceVersion}`}>
            <time dateTime={event.createdAt}>{formatActivityTime(event.createdAt)}</time>
            <strong data-actor={event.actor}>{event.actor.toUpperCase()}</strong>
            <span>{event.outputSummary}</span>
          </div>
        ))}
      </div>
      <div className="log-notice"><span>CURRENT</span><strong>{notice}</strong></div>
      {exportFilename && (
        <button className="log-export" type="button" onClick={onDownloadExport}>
          DOWNLOAD {exportFilename.toUpperCase()} ↓
        </button>
      )}
    </section>
  );
}
