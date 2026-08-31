import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';

interface LaunchBriefProps {
  workspace: FoundryWorkspace;
  researchRun: AutonomousResearchProgress;
  onStartResearch: (problemStatement: string) => Promise<boolean>;
  onStop: () => void;
  onRetry: (problemStatement: string) => void;
  onReset: () => void;
  planName: string;
  remainingRuns: number;
  monthlyRuns: number;
  onOpenPlans: () => void;
}

export function LaunchBrief({ workspace, researchRun, onStartResearch, onStop, onRetry, onReset, planName, remainingRuns, monthlyRuns, onOpenPlans }: LaunchBriefProps) {
  const [problemStatement, setProblemStatement] = useState(workspace.problemBrief.problemStatement);
  const [problemError, setProblemError] = useState('');
  const running = !['idle', 'complete', 'error'].includes(researchRun.phase);
  const retry = (value: string) => {
    const nextProblem = value.trim();
    if (nextProblem.length < 20) {
      setProblemError('Give LaunchPad enough context to research—at least 20 characters.');
      return;
    }
    setProblemError('');
    onRetry(nextProblem);
  };

  if (workspace.stage === 'EMPTY' && researchRun.phase === 'idle') {
    return (
      <section className="launch-brief launch-brief-empty" aria-label="Problem brief">
        <span className="section-kicker">One input / complete research run</span>
        <h1>State the problem. Get the case for what to build.</h1>
        <p className="launch-deck">LaunchPad searches relevant research, extracts the useful findings, challenges the obvious answer, and returns one solution with visible proof.</p>

        <form className="problem-entry" onSubmit={(event) => {
          event.preventDefault();
          const value = problemStatement.trim();
          if (value.length < 20) {
            setProblemError('Give LaunchPad enough context to research—at least 20 characters.');
            return;
          }
          setProblemError('');
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

        <p className="problem-entry-trust"><strong>You stop typing here.</strong> No API key, source hunting, or manual research workflow is required.</p>
      </section>
    );
  }

  return (
    <section className="launch-brief launch-brief-run" aria-label="Research run" aria-live="polite">
      <span className="section-kicker">Autonomous research run</span>
      <h1>{researchRun.phase === 'complete' ? 'One solution. Every claim traceable.' : researchRun.phase === 'error' ? 'The research run paused.' : 'The factory is building your answer.'}</h1>
      <div className="run-problem">
        <label htmlFor="launchpad-run-problem">Problem submitted <small>{running ? 'locked while the run is active' : 'editable before retry'}</small></label>
        <textarea
          id="launchpad-run-problem"
          value={problemStatement}
          onChange={(event) => setProblemStatement(event.target.value)}
          rows={5}
          disabled={running}
          aria-describedby="launchpad-run-problem-help"
        />
        <small id="launchpad-run-problem-help" className="run-problem-help">Change the brief, then save and retry. There is no maximum length.</small>
        {problemError && <p className="problem-entry-error" role="alert">{problemError}</p>}
      </div>

      <div className="run-progress" data-status={researchRun.phase}>
        <div className="run-progress-header">
          <span>{researchRun.phase === 'complete' ? 'Complete' : researchRun.phase === 'error' ? 'Needs retry' : `Working / ${researchRun.progress}%`}</span>
          <strong>{researchRun.message}</strong>
        </div>
        <div className="run-progress-track" aria-label={`${researchRun.progress}% complete`}><span style={{ width: `${researchRun.progress}%` }} /></div>
        <p className="run-progress-handoff">Follow the live production line beside this brief.</p>
        {researchRun.error && <p className="run-error" role="alert">{researchRun.error}</p>}
      </div>

      <div className="run-actions">
        {running && <button type="button" className="run-reset" onClick={onStop}>Stop run</button>}
        {researchRun.phase === 'error' && researchRun.errorCode === 'usage_limit' && (
          <button type="button" className="run-retry" onClick={onOpenPlans}>Change research allowance →</button>
        )}
        {researchRun.phase === 'error' && researchRun.errorCode !== 'usage_limit' && <>
          <button type="button" className="run-retry" onClick={() => retry(problemStatement)}>Save & retry research →</button>
          <button type="button" className="run-retry run-retry-unchanged" onClick={() => retry(workspace.problemBrief.problemStatement)}>Retry unchanged</button>
        </>}
        {researchRun.phase === 'complete' && <a className="run-result-link" href="#launch-result">See the solution and research ↓</a>}
        {!running && <button type="button" className="run-reset" onClick={() => {
          if (window.confirm('Research a new problem? The current result will be cleared.')) onReset();
        }}>Research another problem</button>}
      </div>
    </section>
  );
}
