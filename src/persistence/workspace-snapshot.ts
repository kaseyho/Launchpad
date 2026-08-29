import type { FoundryWorkspace, WorkspaceStage } from '../domain/types';

export const MAX_WORKSPACE_SNAPSHOT_BYTES = 1_500_000;

const stages: WorkspaceStage[] = [
  'EMPTY', 'PROBLEM_DEFINED', 'RESEARCH_PLANNED', 'SOURCING', 'EVIDENCE_REVIEW',
  'INSIGHTS_READY', 'CANDIDATES_READY', 'STRESS_TESTING', 'BLUEPRINT_READY', 'FINALIZED',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWorkspace(value: unknown): value is FoundryWorkspace {
  if (!isRecord(value) || !isRecord(value.problemBrief)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.version === 'number'
    && stages.includes(value.stage as WorkspaceStage)
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
    && typeof value.problemBrief.problemStatement === 'string'
    && Array.isArray(value.researchQuestions)
    && Array.isArray(value.sources)
    && Array.isArray(value.findings)
    && Array.isArray(value.insights)
    && Array.isArray(value.candidates)
    && Array.isArray(value.evidenceLinks)
    && Array.isArray(value.activity)
  );
}

export function encodeWorkspaceSnapshot(workspace: FoundryWorkspace) {
  const snapshot = JSON.stringify(workspace);
  if (new TextEncoder().encode(snapshot).byteLength > MAX_WORKSPACE_SNAPSHOT_BYTES) {
    throw new Error('Workspace snapshot exceeds the maximum size.');
  }
  return snapshot;
}

export function decodeWorkspaceSnapshot(snapshot: string): FoundryWorkspace {
  if (new TextEncoder().encode(snapshot).byteLength > MAX_WORKSPACE_SNAPSHOT_BYTES) {
    throw new Error('Workspace snapshot exceeds the maximum size.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(snapshot);
  } catch {
    throw new Error('Workspace snapshot is not valid JSON.');
  }
  if (!isWorkspace(parsed)) throw new Error('Snapshot is not a valid ProofFoundry workspace.');
  return structuredClone(parsed);
}
