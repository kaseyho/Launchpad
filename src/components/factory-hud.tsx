import type { FoundryWorkspace } from '../domain/types';

const stageOrder = ['EMPTY', 'PROBLEM_DEFINED', 'RESEARCH_PLANNED', 'SOURCING', 'EVIDENCE_REVIEW', 'INSIGHTS_READY', 'CANDIDATES_READY', 'STRESS_TESTING', 'FINALIZED'];

export function FactoryHud({ workspace, webmcpReady = false }: { workspace: FoundryWorkspace; webmcpReady?: boolean }) {
  const accepted = workspace.findings.filter((finding) => finding.reviewStatus === 'accepted' || finding.reviewStatus === 'qualified');
  const gaps = Math.max(0, 6 - accepted.length);
  const conflicts = accepted.filter((finding) => finding.evidenceType === 'counter_evidence').length;
  const selected = workspace.candidates.find((candidate) => candidate.id === workspace.selectedCandidateId);
  const progress = Math.round((stageOrder.indexOf(workspace.stage) / (stageOrder.length - 1)) * 100);

  return (
    <aside className="panel hud-panel" aria-label="Factory status">
      <div className="panel-heading">
        <span>TELEMETRY / LIVE</span>
        <strong>FACTORY HUD</strong>
      </div>
      <dl className="hud-metrics">
        <div><dt>SOURCES</dt><dd data-testid="source-count">{String(workspace.sources.length).padStart(3, '0')}</dd></div>
        <div><dt>FINDINGS</dt><dd>{String(workspace.findings.length).padStart(3, '0')}</dd></div>
        <div><dt>ACCEPTED</dt><dd data-testid="accepted-count">{String(accepted.length).padStart(3, '0')}</dd></div>
        <div className="warning"><dt>GAPS</dt><dd>{String(gaps).padStart(2, '0')}</dd></div>
        <div className="danger"><dt>CONFLICTS</dt><dd>{String(conflicts).padStart(2, '0')}</dd></div>
      </dl>
      <div className="coverage-block">
        <div><span>PRODUCTION PROGRESS</span><strong>{progress}%</strong></div>
        <span className="coverage-track"><span style={{ width: `${progress}%` }} /></span>
      </div>
      {selected && (
        <div className="selected-readout">
          <span>STRONGEST CANDIDATE</span>
          <strong>{selected.name}</strong>
          <small>{selected.coverage}% linked · score {selected.score}</small>
        </div>
      )}
      <div className="agent-readout">
        <span>{webmcpReady ? 'WEBMCP CONNECTED' : 'WEBMCP FALLBACK'}</span>
        <strong>{workspace.activeTool?.toUpperCase() ?? 'AWAITING INSTRUCTION'}<span className="cursor">_</span></strong>
      </div>
      {workspace.lastError && <div className="hud-error" role="alert"><strong>{workspace.lastError.code}</strong><span>{workspace.lastError.message}</span></div>}
    </aside>
  );
}
