import type { FoundryWorkspace } from '../domain/types';
import { FACTORY_STATIONS, getActiveStationKey } from '../presentation/factory-stages';

interface LaunchBriefProps {
  workspace: FoundryWorkspace;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onInspectEvidence: () => void;
  onAddSource: () => void;
  onEditProblem: () => void;
  onReset: () => void;
}

export function LaunchBrief({
  workspace,
  primaryActionLabel,
  onPrimaryAction,
  onInspectEvidence,
  onAddSource,
  onEditProblem,
  onReset,
}: LaunchBriefProps) {
  const brief = workspace.problemBrief;
  const activeStation = FACTORY_STATIONS.find((station) => station.key === getActiveStationKey(workspace.stage)) ?? FACTORY_STATIONS[0];
  const accepted = workspace.findings.filter((finding) => finding.reviewStatus === 'accepted' || finding.reviewStatus === 'qualified').length;

  return (
    <section className="launch-brief" aria-label="Problem brief">
      <span className="section-kicker">Evidence-to-idea workspace · {activeStation.shortName}</span>
      <h1>An idea that can show its work.</h1>
      <p className="launch-deck">ChatGPT uses WebMCP to run LaunchPad’s research tools. You watch the evidence become a defensible idea.</p>

      <div className="brief-card" data-empty={workspace.stage === 'EMPTY'}>
        {workspace.stage === 'EMPTY' ? (
          <>
            <span>Ready for input</span>
            <strong>Start with a messy problem.</strong>
            <p>Load the demo or define your own brief.</p>
          </>
        ) : (
          <>
            <span>Current problem</span>
            <strong>{brief.problemStatement}</strong>
            <p>{brief.targetAudience} · {brief.desiredOutcome}</p>
          </>
        )}
      </div>

      <div className="launch-metrics" aria-label="Workspace evidence counts">
        <div><strong data-testid="source-count">{String(workspace.sources.length).padStart(3, '0')}</strong><span>sources</span></div>
        <div><strong>{String(workspace.findings.length).padStart(3, '0')}</strong><span>findings</span></div>
        <div><strong data-testid="accepted-count">{String(accepted).padStart(3, '0')}</strong><span>accepted</span></div>
      </div>

      <button className="launch-primary-action" type="button" onClick={onPrimaryAction} disabled={workspace.stage === 'FINALIZED'}>
        <span>{primaryActionLabel.toLowerCase()}</span>
        <span aria-hidden="true">→</span>
      </button>

      <details className="launch-more-actions">
        <summary>Manual controls</summary>
        <div className="launch-secondary-actions" aria-label="Manual workspace controls">
          <button type="button" onClick={onEditProblem}>{workspace.stage === 'EMPTY' ? 'Define problem' : 'Edit brief'}</button>
          <button type="button" onClick={onAddSource}>Add source</button>
          <button type="button" onClick={onInspectEvidence} disabled={workspace.findings.length === 0}>Inspect evidence</button>
          <button type="button" onClick={onReset} disabled={workspace.stage === 'EMPTY'}>Reset workspace</button>
        </div>
      </details>
    </section>
  );
}
