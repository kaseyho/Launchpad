import type { ActivityEvent, FoundryWorkspace, WorkspaceStage } from '../domain/types';

export type FactoryStationKey = 'source' | 'evidence' | 'review' | 'signal' | 'idea' | 'stress' | 'blueprint';
export type FactoryStationState = 'complete' | 'active' | 'idle';

export interface FactoryStation {
  key: FactoryStationKey;
  name: string;
  shortName: string;
  description: string;
  order: number;
}

export const FACTORY_STATIONS: FactoryStation[] = [
  { key: 'source', name: 'Source Dock', shortName: 'Sources', description: 'Public research and first-party signals enter the shared workspace.', order: 0 },
  { key: 'evidence', name: 'Evidence Lab', shortName: 'Evidence', description: 'Sources become atomic findings with exact citations and context.', order: 1 },
  { key: 'review', name: 'Review Bay', shortName: 'Review', description: 'A human or agent accepts, qualifies, or rejects every finding.', order: 2 },
  { key: 'signal', name: 'Signal Tower', shortName: 'Insights', description: 'Accepted findings assemble into opportunity themes and contradictions.', order: 3 },
  { key: 'idea', name: 'Idea Forge', shortName: 'Ideas', description: 'Evidence-linked candidates are built and compared without hiding gaps.', order: 4 },
  { key: 'stress', name: 'Stress Chamber', shortName: 'Stress test', description: 'The strongest candidate is challenged by risks and counter-evidence.', order: 5 },
  { key: 'blueprint', name: 'Blueprint Bay', shortName: 'Blueprint', description: 'A testable recommendation is locked with proof, assumptions, and next tests.', order: 6 },
];

const stageOrder: WorkspaceStage[] = [
  'EMPTY',
  'PROBLEM_DEFINED',
  'RESEARCH_PLANNED',
  'SOURCING',
  'EVIDENCE_REVIEW',
  'INSIGHTS_READY',
  'CANDIDATES_READY',
  'STRESS_TESTING',
  'BLUEPRINT_READY',
  'FINALIZED',
];

const activeStationByStage: Record<WorkspaceStage, FactoryStationKey> = {
  EMPTY: 'source',
  PROBLEM_DEFINED: 'source',
  RESEARCH_PLANNED: 'source',
  SOURCING: 'source',
  EVIDENCE_REVIEW: 'review',
  INSIGHTS_READY: 'signal',
  CANDIDATES_READY: 'idea',
  STRESS_TESTING: 'stress',
  BLUEPRINT_READY: 'blueprint',
  FINALIZED: 'blueprint',
};

export function getStageProgress(stage: WorkspaceStage) {
  const index = stageOrder.indexOf(stage);
  return Math.round((Math.max(index, 0) / (stageOrder.length - 1)) * 100);
}

export function getActiveStationKey(stage: WorkspaceStage) {
  return activeStationByStage[stage];
}

export function getStationState(stage: WorkspaceStage, stationKey: FactoryStationKey): FactoryStationState {
  const activeOrder = FACTORY_STATIONS.find((station) => station.key === getActiveStationKey(stage))?.order ?? 0;
  const stationOrder = FACTORY_STATIONS.find((station) => station.key === stationKey)?.order ?? 0;
  if (stationKey === getActiveStationKey(stage)) return 'active';
  return stationOrder < activeOrder ? 'complete' : 'idle';
}

export function getStationMetric(workspace: FoundryWorkspace, stationKey: FactoryStationKey) {
  if (stationKey === 'source') return { value: workspace.sources.length, label: 'sources' };
  if (stationKey === 'evidence') return { value: workspace.findings.length, label: 'findings' };
  if (stationKey === 'review') {
    return {
      value: workspace.findings.filter((finding) => finding.reviewStatus === 'accepted' || finding.reviewStatus === 'qualified').length,
      label: 'accepted findings',
    };
  }
  if (stationKey === 'signal') return { value: workspace.insights.length, label: 'insight clusters' };
  if (stationKey === 'idea') return { value: workspace.candidates.length, label: 'idea candidates' };
  if (stationKey === 'stress') {
    return { value: workspace.candidates.filter((candidate) => candidate.stressTest).length, label: 'stress tests' };
  }
  return { value: workspace.blueprint ? 1 : 0, label: 'blueprints' };
}

export function getLatestAgentEvent(workspace: FoundryWorkspace): ActivityEvent | undefined {
  return workspace.activity.findLast((event) => event.actor === 'agent');
}
