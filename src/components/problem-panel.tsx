import type { FoundryWorkspace } from '../domain/types';

interface ProblemPanelProps {
  workspace: FoundryWorkspace;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onInspectEvidence: () => void;
  onAddSource: () => void;
  onEditProblem: () => void;
  onReset: () => void;
}

export function ProblemPanel({ workspace, primaryActionLabel, onPrimaryAction, onInspectEvidence, onAddSource, onEditProblem, onReset }: ProblemPanelProps) {
  const brief = workspace.problemBrief;
  return (
    <section className="panel problem-panel" aria-label="Problem brief">
      <div className="panel-heading">
        <span>INPUT / {workspace.stage === 'EMPTY' ? '00' : '01'}</span>
        <strong>PROBLEM BRIEF</strong>
      </div>

      {workspace.stage === 'EMPTY' ? (
        <div className="empty-brief">
          <span className="input-mark">+</span>
          <p>NO PROBLEM LOADED</p>
          <small>Define the situation, audience, outcome, and constraints.</small>
        </div>
      ) : (
        <div className="loaded-brief">
          <span className="brief-state">REFINED / HUMAN-EDITABLE</span>
          <p>{brief.problemStatement}</p>
        </div>
      )}

      <dl className="brief-fields">
        <div><dt>AUDIENCE</dt><dd>{brief.targetAudience || '—'}</dd></div>
        <div><dt>OUTCOME</dt><dd>{brief.desiredOutcome || '—'}</dd></div>
        <div><dt>TIMEFRAME</dt><dd>{brief.timeframe || '—'}</dd></div>
        <div><dt>CONSTRAINTS</dt><dd>{String(brief.constraints.length).padStart(2, '0')}</dd></div>
      </dl>

      {brief.constraints.length > 0 && (
        <div className="constraint-list" aria-label="Constraints">
          {brief.constraints.slice(0, 4).map((constraint) => <span key={constraint}>{constraint}</span>)}
        </div>
      )}

      <div className="manual-actions" aria-label="Manual workspace controls">
        <button type="button" onClick={onEditProblem}>{workspace.stage === 'EMPTY' ? '+ DEFINE PROBLEM' : 'EDIT BRIEF'}</button>
        <button type="button" onClick={onAddSource}>+ ADD SOURCE</button>
        <button type="button" onClick={onInspectEvidence} disabled={workspace.findings.length === 0}>INSPECT EVIDENCE</button>
        <button type="button" onClick={onReset} disabled={workspace.stage === 'EMPTY'}>RESET</button>
      </div>

      <button className="primary-action" type="button" onClick={onPrimaryAction} disabled={workspace.stage === 'FINALIZED'}>
        {primaryActionLabel} <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
