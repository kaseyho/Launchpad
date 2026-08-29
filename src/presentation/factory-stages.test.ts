import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import {
  getActiveStationKey,
  getLatestAgentEvent,
  getStageProgress,
  getStationMetric,
  getStationState,
} from './factory-stages';

describe('factory presentation model', () => {
  it('maps workspace stages to visible factory progress', () => {
    expect(getActiveStationKey('EMPTY')).toBe('source');
    expect(getActiveStationKey('CANDIDATES_READY')).toBe('idea');
    expect(getActiveStationKey('FINALIZED')).toBe('blueprint');
    expect(getStageProgress('EMPTY')).toBe(0);
    expect(getStageProgress('FINALIZED')).toBe(100);
    expect(getStationState('CANDIDATES_READY', 'review')).toBe('complete');
    expect(getStationState('CANDIDATES_READY', 'stress')).toBe('idle');
  });

  it('derives station metrics and the latest real agent event', () => {
    const workspace = createInitialWorkspace();
    expect(getStationMetric(workspace, 'source')).toEqual({ value: 0, label: 'sources' });
    expect(getLatestAgentEvent(workspace)).toBeUndefined();

    workspace.activity.push({
      id: 'event-human',
      actor: 'human',
      toolName: 'update_problem_brief',
      inputSummary: 'Defined a problem.',
      outputSummary: 'Problem saved.',
      createdAt: '2026-08-29T00:00:00.000Z',
      workspaceVersion: 1,
      status: 'success',
    }, {
      id: 'event-agent',
      actor: 'agent',
      toolName: 'plan_research',
      inputSummary: 'Plan activation research.',
      outputSummary: 'Research plan created.',
      createdAt: '2026-08-29T00:00:01.000Z',
      workspaceVersion: 2,
      status: 'success',
    });

    expect(getLatestAgentEvent(workspace)?.toolName).toBe('plan_research');
  });
});
