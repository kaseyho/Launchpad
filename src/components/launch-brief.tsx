import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';

interface LaunchBriefProps {
  workspace: FoundryWorkspace;
  researchRun: AutonomousResearchProgress;
  onStartResearch: (problemStatement: string) => Promise<boolean>;
  onStop: () => void;
  onRetry: () => void;
  onReset: () => void;
  planName: string;
  remainingRuns: number;
  monthlyRuns: number;
  onOpenPlans: () => void;
}

export function LaunchBrief({ workspace, researchRun, onStartResearch, onStop, onRetry, onReset, planName, remainingRuns, monthlyRuns, onOpenPlans }: LaunchBriefProps) {
  const [problemStatement, setProblemStatement] = useState('');
  const [problemError, setProblemError] = useState('');
  const running = !['idle', 'complete', 'error'].includes(researchRun.phase);

  if (workspace.stage === 'EMPTY' && researchRun.phase === 'idle') {
    return (
      <section className="launch-brief launch-brief-empty" aria-label="Problem brief">
        <span className="section-kicker">Research with WebMCP</span>
        <h1>Describe a problem. Get a researched solution.</h1>
        <p className="launch-deck">LaunchPad searches research, checks conflicting findings, and builds one solution with sources.</p>

        <form className="problem-entry" onSubmit={(event) => {
          event.preventDefault();
          const value = problemStatement.trim();
          if (value.length < 20) {
            setProblemError('Give LaunchPad enough context to research—at least 20 characters.');
            return;
          }
          setProblemError('');
          setProblemStatement('');
          void onStartResearch(value);
        }}>
          <label htmlFor="launchpad-problem">What problem should LaunchPad solve?</label>
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
            <span>{planName.toUpperCase()} / {remainingRuns} OF {monthlyRuns} RUNS LEFT</span>
            <button type="submit">Research this problem <span aria-hidden="true">→</span></button>
          </div>
          {problemError && <p className="problem-entry-error" role="alert">{problemError}</p>}
        </form>

        <p className="problem-entry-trust"><strong>You only enter the problem.</strong> No API key or source search.</p>
      </section>
    );
  }

  return (
    <section className="launch-brief launch-brief-run" aria-label="Research run" aria-live="polite">
      <span className="section-kicker">Research run</span>
      <h1>{researchRun.phase === 'complete' ? 'Solution ready.' : researchRun.phase === 'error' ? 'Research stopped.' : 'Research in progress.'}</h1>
      <div className="run-problem">
        <span>Problem submitted</span>
        <strong>{workspace.problemBrief.problemStatement}</strong>
      </div>

      <div className="run-progress" data-status={researchRun.phase}>
        <div className="run-progress-header">
          <span>{researchRun.phase === 'complete' ? 'Complete' : researchRun.phase === 'error' ? 'Needs retry' : `Working / ${researchRun.progress}%`}</span>
          <strong>{researchRun.message}</strong>
        </div>
        <div className="run-progress-track" aria-label={`${researchRun.progress}% complete`}><span style={{ width: `${researchRun.progress}%` }} /></div>
        <p className="run-progress-handoff">The factory shows each research step.</p>
        {researchRun.error && <p className="run-error" role="alert">{researchRun.error}</p>}
      </div>

      <div className="run-actions">
        {running && <button type="button" className="run-reset" onClick={onStop}>Stop run</button>}
        {researchRun.phase === 'error' && researchRun.errorCode === 'usage_limit' && (
          <button type="button" className="run-retry" onClick={onOpenPlans}>Change research allowance →</button>
        )}
        {researchRun.phase === 'error' && researchRun.errorCode !== 'usage_limit' && <button type="button" className="run-retry" onClick={onRetry}>Retry research →</button>}
        {researchRun.phase === 'complete' && <a className="run-result-link" href="#launch-result">View solution ↓</a>}
        {!running && <button type="button" className="run-reset" onClick={() => {
          if (window.confirm('Research a new problem? The current result will be cleared.')) onReset();
        }}>Research another problem</button>}
      </div>
    </section>
  );
}
