import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchPhase, AutonomousResearchProgress } from '../research/autonomous-research';

export type FactoryProductionStatus = 'empty' | 'running' | 'error' | 'complete';

export interface FactoryProductionStep {
  phase: Exclude<AutonomousResearchPhase, 'idle' | 'error'>;
  label: string;
  station: string;
}

export interface FactoryProductionView {
  status: FactoryProductionStatus;
  progress: number;
  activeIndex: number;
  activeLabel: string;
  activeStation: string;
  inputLabel: string;
  inputDetail: string;
  outputLabel: string;
  outputDetail: string;
}

export const FACTORY_PRODUCTION_STEPS: FactoryProductionStep[] = [
  { phase: 'planning', label: 'Frame', station: 'Intake gate' },
  { phase: 'searching', label: 'Source', station: 'Source dock' },
  { phase: 'extracting', label: 'Extract', station: 'Evidence lab' },
  { phase: 'synthesizing', label: 'Synthesize', station: 'Signal tower' },
  { phase: 'ideating', label: 'Build', station: 'Idea forge' },
  { phase: 'stress_testing', label: 'Test', station: 'Stress chamber' },
  { phase: 'complete', label: 'Ship', station: 'Output bay' },
];

function compact(value: string, fallback: string, limit = 88) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return fallback;
  return normalized.length > limit ? `${normalized.slice(0, limit - 1).trim()}…` : normalized;
}

function activeStepIndex(phase: AutonomousResearchPhase) {
  if (phase === 'idle') return -1;
  if (phase === 'error') return -1;
  return FACTORY_PRODUCTION_STEPS.findIndex((step) => step.phase === phase);
}

export function getFactoryProductionView(
  workspace: FoundryWorkspace,
  run: AutonomousResearchProgress,
): FactoryProductionView {
  const problem = compact(
    workspace.problemBrief.problemStatement,
    'Problem statement enters here',
  );
  const evidenceDetail = workspace.sources.length || workspace.findings.length
    ? `${workspace.sources.length} sources · ${workspace.findings.length} findings`
    : 'Sources and findings will be packed with it';

  if (run.phase === 'idle') {
    return {
      status: 'empty',
      progress: 0,
      activeIndex: -1,
      activeLabel: 'Awaiting input',
      activeStation: 'Intake gate',
      inputLabel: workspace.problemBrief.problemStatement ? 'Problem held' : 'Input open',
      inputDetail: problem,
      outputLabel: 'Output empty',
      outputDetail: 'Solution + proof exits here',
    };
  }

  if (run.phase === 'error') {
    return {
      status: 'error',
      progress: Math.max(0, Math.min(100, run.progress)),
      activeIndex: -1,
      activeLabel: 'Line paused',
      activeStation: 'Retry checkpoint',
      inputLabel: 'Problem retained',
      inputDetail: problem,
      outputLabel: 'Output blocked',
      outputDetail: 'Retry without re-entering the brief',
    };
  }

  const index = activeStepIndex(run.phase);
  const step = FACTORY_PRODUCTION_STEPS[Math.max(index, 0)];
  if (run.phase === 'complete') {
    return {
      status: 'complete',
      progress: 100,
      activeIndex: index,
      activeLabel: 'Blueprint shipped',
      activeStation: 'Output bay',
      inputLabel: 'Problem processed',
      inputDetail: problem,
      outputLabel: workspace.blueprint?.name ?? 'Solution ready',
      outputDetail: evidenceDetail,
    };
  }

  return {
    status: 'running',
    progress: Math.max(0, Math.min(100, run.progress)),
    activeIndex: index,
    activeLabel: step.label,
    activeStation: step.station,
    inputLabel: run.progress < 28 ? 'Problem entering' : 'Problem received',
    inputDetail: problem,
    outputLabel: 'Building output',
    outputDetail: evidenceDetail,
  };
}
