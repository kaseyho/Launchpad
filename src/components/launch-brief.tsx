import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import { FACTORY_STATIONS, getActiveStationKey } from '../presentation/factory-stages';

interface LaunchBriefProps {
  workspace: FoundryWorkspace;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onDefineProblem: (problemStatement: string) => boolean;
  onInspectEvidence: () => void;
  onAddSource: () => void;
  onEditProblem: () => void;
  onReset: () => void;
}

export function LaunchBrief({
  workspace,
  primaryActionLabel,
  onPrimaryAction,
  onDefineProblem,
  onInspectEvidence,
  onAddSource,
  onEditProblem,
  onReset,
}: LaunchBriefProps) {
  const brief = workspace.problemBrief;
  const [problemStatement, setProblemStatement] = useState('');
  const [problemError, setProblemError] = useState('');
  const activeStation = FACTORY_STATIONS.find((station) => station.key === getActiveStationKey(workspace.stage)) ?? FACTORY_STATIONS[0];
  const accepted = workspace.findings.filter((finding) => finding.reviewStatus === 'accepted' || finding.reviewStatus === 'qualified').length;

  if (workspace.stage === 'EMPTY') {
    return (
      <section className="launch-brief launch-brief-empty" aria-label="Problem brief">
        <span className="section-kicker">Problem hopper / your input</span>
        <h1>Put your problem on the line.</h1>
        <p className="launch-deck">Describe the real problem in your own words. LaunchPad turns it into shared, tool-ready state for you and your browser agent.</p>

        <form className="problem-entry" onSubmit={(event) => {
          event.preventDefault();
          const value = problemStatement.trim();
          if (value.length < 20) {
            setProblemError('Give the factory a little more context—at least 20 characters.');
            return;
          }
          setProblemError('');
          if (onDefineProblem(value)) setProblemStatement('');
        }}>
          <label htmlFor="launchpad-problem">Your problem statement</label>
          <textarea
            id="launchpad-problem"
            value={problemStatement}
            onChange={(event) => {
              setProblemStatement(event.target.value);
              if (problemError) setProblemError('');
            }}
            rows={6}
            maxLength={1200}
            placeholder="Example: Independent restaurants lose new staff during first-week training because managers cannot provide consistent, role-specific guidance."
            autoFocus
            required
          />
          <div className="problem-entry-footer">
            <span>{problemStatement.length} / 1200</span>
            <button type="submit">Start with my problem <span aria-hidden="true">→</span></button>
          </div>
          {problemError && <p className="problem-entry-error" role="alert">{problemError}</p>}
        </form>

        <p className="problem-entry-trust"><strong>No API key required.</strong> WebMCP uses the agent already connected to your supported browser; LaunchPad never asks you to paste a secret.</p>
      </section>
    );
  }

  return (
    <section className="launch-brief" aria-label="Problem brief">
      <span className="section-kicker">Your problem · {activeStation.shortName}</span>
      <h1>Build the case before the build.</h1>
      <p className="launch-deck">Your browser agent can now operate LaunchPad’s typed tools against this exact problem. Every source, finding, and idea stays visible here.</p>

      <div className="brief-card">
        <span>Problem on the line</span>
        <strong>{brief.problemStatement}</strong>
        {(brief.targetAudience || brief.desiredOutcome) && (
          <p>{[brief.targetAudience, brief.desiredOutcome].filter(Boolean).join(' · ')}</p>
        )}
        <div className="brief-card-actions">
          <button type="button" className="brief-edit" onClick={onEditProblem}>Add audience, outcome + constraints</button>
          <button type="button" className="brief-reset" onClick={() => {
            if (window.confirm('Start a new problem? The current workspace will be cleared.')) onReset();
          }}>Start new problem</button>
        </div>
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
          <button type="button" onClick={onEditProblem}>Edit brief</button>
          <button type="button" onClick={onAddSource}>Add source</button>
          <button type="button" onClick={onInspectEvidence} disabled={workspace.findings.length === 0}>Inspect evidence</button>
          <button type="button" onClick={onReset}>Reset workspace</button>
        </div>
      </details>
    </section>
  );
}
