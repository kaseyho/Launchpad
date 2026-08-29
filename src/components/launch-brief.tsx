import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress, AutonomousResearchPhase } from '../research/autonomous-research';

interface LaunchBriefProps {
  workspace: FoundryWorkspace;
  researchRun: AutonomousResearchProgress;
  onStartResearch: (problemStatement: string) => Promise<boolean>;
  onRetry: () => void;
  onReset: () => void;
}

const RUN_STEPS: Array<{ phase: AutonomousResearchPhase; label: string }> = [
  { phase: 'planning', label: 'Frame the research' },
  { phase: 'searching', label: 'Find relevant studies' },
  { phase: 'extracting', label: 'Extract cited findings' },
  { phase: 'synthesizing', label: 'Find the mechanisms' },
  { phase: 'ideating', label: 'Build one solution' },
  { phase: 'stress_testing', label: 'Challenge the recommendation' },
];

function phaseIndex(phase: AutonomousResearchPhase) {
  if (phase === 'complete') return RUN_STEPS.length;
  return RUN_STEPS.findIndex((step) => step.phase === phase);
}

export function LaunchBrief({ workspace, researchRun, onStartResearch, onRetry, onReset }: LaunchBriefProps) {
  const [problemStatement, setProblemStatement] = useState('');
  const [problemError, setProblemError] = useState('');
  const running = !['idle', 'complete', 'error'].includes(researchRun.phase);
  const currentStep = phaseIndex(researchRun.phase);

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
            <span>{problemStatement.length} / 1200</span>
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
        <span>Problem submitted</span>
        <strong>{workspace.problemBrief.problemStatement}</strong>
      </div>

      <div className="run-progress" data-status={researchRun.phase}>
        <div className="run-progress-header">
          <span>{researchRun.phase === 'complete' ? 'Complete' : researchRun.phase === 'error' ? 'Needs retry' : `Working / ${researchRun.progress}%`}</span>
          <strong>{researchRun.message}</strong>
        </div>
        <div className="run-progress-track" aria-label={`${researchRun.progress}% complete`}><span style={{ width: `${researchRun.progress}%` }} /></div>
        <ol className="run-steps">
          {RUN_STEPS.map((step, index) => {
            const state = researchRun.phase === 'error' && index === currentStep
              ? 'error'
              : index < currentStep || researchRun.phase === 'complete'
                ? 'complete'
                : index === currentStep
                  ? 'active'
                  : 'queued';
            return <li key={step.phase} data-state={state}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step.label}</strong><i aria-hidden="true" /></li>;
          })}
        </ol>
        {researchRun.error && <p className="run-error" role="alert">{researchRun.error}</p>}
      </div>

      <div className="run-actions">
        {researchRun.phase === 'error' && <button type="button" className="run-retry" onClick={onRetry}>Retry research →</button>}
        {researchRun.phase === 'complete' && <a className="run-result-link" href="#launch-result">See the solution and research ↓</a>}
        {!running && <button type="button" className="run-reset" onClick={() => {
          if (window.confirm('Research a new problem? The current result will be cleared.')) onReset();
        }}>Research another problem</button>}
      </div>
    </section>
  );
}
