import type { WorkspaceStage } from '../domain/types';

export interface AgentToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentEvalCase {
  id: string;
  stage: WorkspaceStage;
  prompt: string;
  requiredCalls: string[];
  orderedCalls: string[];
  orderedCallAlternatives?: string[][];
  argumentChecks?: Array<{
    tool: string;
    description: string;
    test: (args: Record<string, unknown>) => boolean;
  }>;
  simulatedResults?: Record<string, Record<string, unknown>>;
}

const hasProvenanceBatch = (args: Record<string, unknown>) => {
  const items = args.items as Array<Record<string, unknown>> | undefined;
  return Boolean(items?.length && items.every((item) => {
    const provenance = item.provenance as Record<string, unknown> | undefined;
    return item.title && item.excerpt && provenance?.origin && provenance.retrieved_at && provenance.retrieval_method;
  }));
};

export const WEBMCP_AGENT_EVALS: AgentEvalCase[] = [
  {
    id: 'direct-mission-start',
    stage: 'EMPTY',
    prompt: 'Use this live LaunchPad page to research the problem I entered and build the evidence-backed recommendation.',
    requiredCalls: ['get_foundry_state', 'research_and_ideate'],
    orderedCalls: ['get_foundry_state', 'research_and_ideate'],
    simulatedResults: {
      get_foundry_state: {
        ok: true,
        workspace_version: 7,
        data: {
          stage: 'EMPTY',
          version: 7,
          problemBrief: { problemStatement: 'New administrators abandon setup before reaching first value.' },
          counts: { sources: 0, findings: 0, acceptedFindings: 0, candidates: 0 },
          warnings: [],
        },
        next_actions: ['research_and_ideate', 'update_problem_brief'],
      },
      research_and_ideate: {
        ok: true,
        workspace_version: 18,
        message: 'The evidence-backed recommendation is ready and visible.',
        next_actions: ['get_foundry_state'],
      },
    },
  },
  {
    id: 'ambiguous-live-context-ingestion',
    stage: 'SOURCING',
    prompt: 'I found this public evidence in the browser. After checking the live workspace, add it with complete provenance: title “Setup usability study”, source type report, lane customer, URL https://example.org/setup-study, excerpt “Observed administrators abandoned setup when configuration preceded a visible outcome.”, retrieved at 2026-08-31T08:30:00.000Z by browser_agent from public_web. Do not assume any private access.',
    requiredCalls: ['get_foundry_state', 'ingest_evidence_batch'],
    orderedCalls: ['get_foundry_state', 'ingest_evidence_batch'],
    argumentChecks: [{ tool: 'ingest_evidence_batch', description: 'batch includes complete provenance and retrieval metadata', test: hasProvenanceBatch }],
    simulatedResults: {
      get_foundry_state: {
        ok: true,
        workspace_version: 11,
        data: {
          stage: 'SOURCING',
          version: 11,
          problemBrief: { problemStatement: 'New administrators abandon setup before reaching first value.' },
          counts: { sources: 3, findings: 0, acceptedFindings: 0, candidates: 0 },
          warnings: ['Customer evidence is still sparse.'],
        },
        next_actions: ['ingest_evidence_batch', 'extract_findings', 'get_evidence_gaps'],
      },
      ingest_evidence_batch: {
        ok: true,
        workspace_version: 12,
        modified_ids: ['source-browser-1'],
        message: 'One provenance-rich public source was added.',
        next_actions: ['extract_findings', 'get_evidence_gaps'],
      },
    },
  },
  {
    id: 'counterfactual-policy',
    stage: 'CANDIDATES_READY',
    prompt: 'Show me what changes if we use only papers and reports, require two independent source families, and exclude private evidence. Apply it only after comparing.',
    requiredCalls: ['get_foundry_state', 'compare_evidence_policy', 'apply_evidence_policy'],
    orderedCalls: ['get_foundry_state', 'compare_evidence_policy', 'apply_evidence_policy'],
    argumentChecks: [{
      tool: 'compare_evidence_policy',
      description: 'comparison encodes source type, corroboration, and privacy constraints',
      test: (args) => Array.isArray(args.allowed_source_types)
        && args.minimum_corroboration === 2
        && args.include_private === false,
    }],
    simulatedResults: {
      get_foundry_state: {
        ok: true,
        workspace_version: 20,
        data: {
          stage: 'CANDIDATES_READY',
          version: 20,
          selectedCandidate: { id: 'candidate-a', name: 'Guided First Value', coverage: 92, score: 88 },
          counts: { sources: 8, findings: 10, acceptedFindings: 9, candidates: 3 },
          warnings: [],
        },
        next_actions: ['compare_evidence_policy', 'inspect_candidate', 'stress_test_candidate'],
      },
      compare_evidence_policy: {
        ok: true,
        workspace_version: 20,
        data: {
          proposedPolicy: { allowedSourceTypes: ['paper', 'report'], minimumCorroboration: 2, includePrivate: false },
          recommendationChanged: true,
          baselineRanking: [{ candidateId: 'candidate-a', rank: 1 }],
          proposedRanking: [{ candidateId: 'candidate-b', rank: 1 }],
        },
        message: 'Comparison complete; the workspace is unchanged.',
        next_actions: ['apply_evidence_policy'],
      },
      apply_evidence_policy: {
        ok: true,
        workspace_version: 21,
        modified_ids: ['evidence-policy', 'candidate-a', 'candidate-b'],
        message: 'Evidence policy applied without deleting evidence.',
        next_actions: ['get_foundry_state', 'inspect_candidate'],
      },
    },
  },
  {
    id: 'denied-consent-recovery',
    stage: 'EVIDENCE_REVIEW',
    prompt: 'Accept proposed findings finding-17 and finding-18 using preview workspace version 12. If I decline the consent dialog, respect that decision and read back the unchanged current state.',
    requiredCalls: ['review_evidence_with_consent', 'get_foundry_state'],
    orderedCalls: ['review_evidence_with_consent', 'get_foundry_state'],
    simulatedResults: {
      review_evidence_with_consent: {
        ok: false,
        error: { code: 'USER_DECLINED', message: 'The human declined the evidence decision.' },
        workspace_version: 12,
        next_actions: ['get_foundry_state'],
      },
      get_foundry_state: {
        ok: true,
        workspace_version: 12,
        data: {
          stage: 'EVIDENCE_REVIEW',
          version: 12,
          counts: { sources: 6, findings: 8, acceptedFindings: 4, candidates: 0 },
          warnings: ['Two findings remain pending review.'],
        },
        message: 'Workspace remains unchanged after declined consent.',
        next_actions: ['review_evidence_with_consent', 'get_evidence_gaps'],
      },
    },
  },
  {
    id: 'missing-counter-evidence',
    stage: 'CANDIDATES_READY',
    prompt: 'Stress-test candidate-a. If counter-evidence is missing, inspect the gap and add this public counter-signal before retrying: title “Mandatory onboarding controls”, source type paper, lane counter, URL https://example.org/onboarding-control, excerpt “Experienced operators disengaged when tutorials could not be skipped.”, retrieved at 2026-08-31T09:00:00.000Z by browser_agent from public_web.',
    requiredCalls: ['stress_test_candidate', 'get_evidence_gaps', 'ingest_evidence_batch'],
    orderedCalls: ['stress_test_candidate', 'get_evidence_gaps', 'ingest_evidence_batch'],
    orderedCallAlternatives: [['get_evidence_gaps', 'ingest_evidence_batch', 'stress_test_candidate']],
    argumentChecks: [{ tool: 'ingest_evidence_batch', description: 'recovery evidence includes provenance', test: hasProvenanceBatch }],
    simulatedResults: {
      get_foundry_state: {
        ok: true,
        workspace_version: 19,
        data: {
          stage: 'CANDIDATES_READY',
          version: 19,
          selectedCandidate: { id: 'candidate-a', name: 'Guided First Value', coverage: 92, score: 88 },
          counts: { sources: 7, findings: 8, acceptedFindings: 7, candidates: 3 },
          warnings: ['No eligible counter-evidence is available.'],
        },
        next_actions: ['stress_test_candidate', 'get_evidence_gaps'],
      },
      stress_test_candidate: {
        ok: false,
        error: { code: 'COUNTER_EVIDENCE_REQUIRED', message: 'Add eligible counter-evidence before stress testing.' },
        workspace_version: 19,
        next_actions: ['get_evidence_gaps', 'ingest_evidence_batch'],
      },
      get_evidence_gaps: {
        ok: true,
        workspace_version: 19,
        data: {
          gaps: ['At least one counter-evidence finding is required.'],
          nextActions: [{ lane: 'counter', evidenceType: 'counter_evidence', suggestedTool: 'ingest_evidence_batch' }],
        },
        next_actions: ['ingest_evidence_batch'],
      },
      ingest_evidence_batch: {
        ok: true,
        workspace_version: 20,
        modified_ids: ['source-counter-browser'],
        message: 'The provenance-rich counter-signal was added.',
        next_actions: ['extract_findings'],
      },
    },
  },
  {
    id: 'stale-version-recovery',
    stage: 'BLUEPRINT_READY',
    prompt: 'Finalize previewed candidate-a using preview workspace version 23. The commit reports stale state; recover safely and do not reuse the old workspace version.',
    requiredCalls: ['finalize_blueprint_with_consent', 'get_foundry_state', 'preview_finalization'],
    orderedCalls: ['finalize_blueprint_with_consent', 'get_foundry_state', 'preview_finalization'],
    simulatedResults: {
      finalize_blueprint_with_consent: {
        ok: false,
        error: { code: 'STALE_WORKSPACE_VERSION', message: 'Expected v23 but the visible workspace is v24.' },
        workspace_version: 24,
        next_actions: ['get_foundry_state'],
      },
      get_foundry_state: {
        ok: true,
        workspace_version: 24,
        data: {
          stage: 'BLUEPRINT_READY',
          version: 24,
          selectedCandidate: { id: 'candidate-a', name: 'Guided First Value', coverage: 100, score: 94 },
          counts: { sources: 9, findings: 11, acceptedFindings: 10, candidates: 3 },
          warnings: [],
        },
        next_actions: ['preview_finalization'],
      },
      preview_finalization: {
        ok: true,
        workspace_version: 24,
        data: { candidateId: 'candidate-a', canFinalize: true, gaps: [], unsupportedComponents: [] },
        message: 'Finalization is ready for a human consent checkpoint.',
        next_actions: ['finalize_blueprint_with_consent'],
      },
    },
  },
  {
    id: 'mid-chain-finalization-failure',
    stage: 'BLUEPRINT_READY',
    prompt: 'Finish candidate-a. If finalization fails a quality gate mid-chain, diagnose the exact gap and use this recoverable public evidence action instead of claiming success: ingest title “Onboarding control study”, source type paper, lane counter, URL https://example.org/control-study, excerpt “Optional guidance preserved completion among experienced operators.”, retrieved at 2026-08-31T09:15:00.000Z by browser_agent from public_web.',
    requiredCalls: ['preview_finalization', 'get_evidence_gaps', 'ingest_evidence_batch'],
    orderedCalls: ['preview_finalization', 'get_evidence_gaps', 'ingest_evidence_batch'],
    argumentChecks: [{ tool: 'ingest_evidence_batch', description: 'mid-chain recovery includes provenance', test: hasProvenanceBatch }],
    simulatedResults: {
      get_foundry_state: {
        ok: true,
        workspace_version: 31,
        data: {
          stage: 'BLUEPRINT_READY',
          version: 31,
          selectedCandidate: { id: 'candidate-a', name: 'Guided First Value', coverage: 86, score: 82 },
          counts: { sources: 8, findings: 10, acceptedFindings: 9, candidates: 3 },
          warnings: [],
        },
        next_actions: ['preview_finalization'],
      },
      preview_finalization: {
        ok: true,
        data: { candidateId: 'candidate-a', canFinalize: false, gaps: ['Counter-evidence required'], unsupportedComponents: ['mechanism'] },
        workspace_version: 31,
        message: 'Finalization is blocked; close the listed evidence gaps first.',
        next_actions: ['get_evidence_gaps', 'ingest_evidence_batch'],
      },
      get_evidence_gaps: {
        ok: true,
        workspace_version: 31,
        data: {
          gaps: ['Counter-evidence required'],
          nextActions: [{ lane: 'counter', evidenceType: 'counter_evidence', suggestedTool: 'ingest_evidence_batch' }],
        },
        next_actions: ['ingest_evidence_batch'],
      },
      ingest_evidence_batch: {
        ok: true,
        workspace_version: 32,
        modified_ids: ['source-control-study'],
        message: 'Recovery evidence was added with provenance.',
        next_actions: ['extract_findings'],
      },
    },
  },
];

export function simulateAgentToolResult(evalCase: AgentEvalCase, toolName: string): Record<string, unknown> {
  const configured = evalCase.simulatedResults?.[toolName];
  if (configured) return structuredClone({ modified_ids: [], next_actions: [], ...configured });
  return {
    ok: true,
    workspace_version: 10,
    modified_ids: [],
    next_actions: [],
    message: `${toolName} completed in the simulated workspace.`,
  };
}

export function scoreAgentEval(evalCase: AgentEvalCase, calls: AgentToolCall[]) {
  const failedChecks: string[] = [];
  for (const required of evalCase.requiredCalls) {
    if (!calls.some((call) => call.name === required)) failedChecks.push(`Missing required call: ${required}`);
  }
  const orderedPaths = [evalCase.orderedCalls, ...(evalCase.orderedCallAlternatives ?? [])];
  const matchesPath = (path: string[]) => {
    let cursor = -1;
    return path.every((ordered) => {
      const next = calls.findIndex((call, index) => index > cursor && call.name === ordered);
      if (next === -1) return false;
      cursor = next;
      return true;
    });
  };
  if (!orderedPaths.some(matchesPath)) {
    let cursor = -1;
    for (const ordered of evalCase.orderedCalls) {
      const next = calls.findIndex((call, index) => index > cursor && call.name === ordered);
      if (next === -1) {
        failedChecks.push(`Required order was not observed at: ${ordered}`);
        break;
      }
      cursor = next;
    }
  }
  for (const check of evalCase.argumentChecks ?? []) {
    const call = calls.find((item) => item.name === check.tool);
    if (!call || !check.test(call.arguments)) failedChecks.push(`Invalid ${check.tool} arguments: ${check.description}.`);
  }
  return {
    passed: failedChecks.length === 0,
    score: Math.max(0, 1 - (failedChecks.length / Math.max(1, evalCase.requiredCalls.length + (evalCase.argumentChecks?.length ?? 0)))),
    failedChecks,
  };
}
