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
      <span className="section-kicker">Current launch · {activeStation.name}</span>
      <h1>Turn scattered evidence into an idea you can defend.</h1>
      <p className="launch-deck">LaunchPad gives people and agents one shared workspace for researching a problem, challenging the evidence, and deciding what is worth testing.</p>

      <div className="brief-card" data-empty={workspace.stage === 'EMPTY'}>
        {workspace.stage === 'EMPTY' ? (
          <>
            <span>Start with the decision</span>
            <strong>No problem defined yet.</strong>
            <p>Load the curated demo or describe the situation, audience, and outcome yourself.</p>
          </>
        ) : (
          <>
            <span>{workspace.title}</span>
            <strong>{brief.problemStatement}</strong>
            <dl>
              <div><dt>Audience</dt><dd>{brief.targetAudience}</dd></div>
              <div><dt>Outcome</dt><dd>{brief.desiredOutcome}</dd></div>
              <div><dt>Constraints</dt><dd>{brief.constraints.length}</dd></div>
            </dl>
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
        <span aria-hidden="true">↗</span>
      </button>

      <div className="launch-secondary-actions" aria-label="Manual workspace controls">
        <button type="button" onClick={onEditProblem}>{workspace.stage === 'EMPTY' ? 'Define problem' : 'Edit brief'}</button>
        <button type="button" onClick={onAddSource}>Add source</button>
        <button type="button" onClick={onInspectEvidence} disabled={workspace.findings.length === 0}>Inspect evidence</button>
        <button type="button" onClick={onReset} disabled={workspace.stage === 'EMPTY'}>Reset</button>
      </div>
    </section>
  );
}
