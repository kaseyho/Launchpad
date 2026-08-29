import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { getFactoryProductionView } from './factory-production';

describe('factory production view', () => {
  it('shows an open input and a named output before a run starts', () => {
    const view = getFactoryProductionView(createInitialWorkspace(), {
      phase: 'idle',
      progress: 0,
      message: 'Waiting for your problem statement.',
    });

    expect(view.status).toBe('empty');
    expect(view.inputLabel).toBe('Input open');
    expect(view.outputDetail).toMatch(/solution \+ proof exits here/i);
  });

  it('maps autonomous research phases onto visible factory stations', () => {
    const workspace = createInitialWorkspace();
    workspace.problemBrief.problemStatement = 'Independent restaurants lose new staff during inconsistent first-week training.';
    workspace.sources.push({} as FoundryWorkspaceSource);
    workspace.findings.push({} as FoundryWorkspaceFinding);

    const view = getFactoryProductionView(workspace, {
      phase: 'synthesizing',
      progress: 68,
      message: 'Clustering mechanisms.',
    });

    expect(view).toMatchObject({
      status: 'running',
      activeLabel: 'Synthesize',
      activeStation: 'Signal tower',
      inputLabel: 'Problem received',
      outputLabel: 'Building output',
      outputDetail: '1 sources · 1 findings',
    });
  });

  it('keeps the input available when production pauses', () => {
    const workspace = createInitialWorkspace();
    workspace.problemBrief.problemStatement = 'A sufficiently detailed problem that should remain available after an error.';

    const view = getFactoryProductionView(workspace, {
      phase: 'error',
      progress: 48,
      message: 'Research needs another attempt.',
      error: 'A source adapter failed.',
    });

    expect(view.status).toBe('error');
    expect(view.inputLabel).toBe('Problem retained');
    expect(view.outputLabel).toBe('Output blocked');
  });
});

type FoundryWorkspaceSource = ReturnType<typeof createInitialWorkspace>['sources'][number];
type FoundryWorkspaceFinding = ReturnType<typeof createInitialWorkspace>['findings'][number];
