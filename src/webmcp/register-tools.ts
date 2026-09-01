import type { FoundryService } from '../domain/foundry-service';
import type { AgentConsentRequest } from '../components/agent-consent-dialog';
import type { EvidenceBatchItem, EvidencePolicyComparison, EvidenceType, IdeaCandidateProposal, ProblemBrief, ServiceResult, Source, SourceLane, TraceNode, WorkspaceStage } from '../domain/types';

export const WEBMCP_TOOL_COUNT = 22;
export const MAX_TOOL_OUTPUT_CHARS = 1500;

type JSONSchema = {
  type: 'object';
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties: false;
};

export interface WebMCPToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface WebMCPToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: JSONSchema;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<WebMCPToolResult> | WebMCPToolResult;
}

export interface ModelContextLike {
  registerTool: (definition: WebMCPToolDefinition, options?: { signal?: AbortSignal }) => Promise<void> | void;
}

interface RegisterOptions {
  stage?: WorkspaceStage;
  onTrace?: (nodes: TraceNode[]) => void;
  onExport?: (file: { filename: string; mimeType: string; content: string }) => void;
  onResearch?: (problemStatement?: string, signal?: AbortSignal) => Promise<boolean>;
  requestConsent?: (request: AgentConsentRequest, signal?: AbortSignal) => Promise<boolean>;
  onPolicyComparison?: (comparison: EvidencePolicyComparison, workspaceVersion: number) => void;
}

export interface WebMCPRegistration {
  ready: Promise<void>;
  dispose: () => void;
  toolNames: string[];
}

const recoveryTools = ['search_sources', 'import_source', 'ingest_evidence_batch', 'extract_findings', 'review_evidence_with_consent'] as const;

const stageTools: Record<WorkspaceStage, string[]> = {
  EMPTY: ['get_foundry_state', 'research_and_ideate', 'update_problem_brief'],
  PROBLEM_DEFINED: ['get_foundry_state', 'research_and_ideate', 'update_problem_brief', 'plan_research'],
  RESEARCH_PLANNED: ['get_foundry_state', 'research_and_ideate', 'search_sources', 'import_source', 'ingest_evidence_batch', 'extract_findings', 'get_evidence_gaps'],
  SOURCING: ['get_foundry_state', 'research_and_ideate', 'search_sources', 'import_source', 'ingest_evidence_batch', 'extract_findings', 'get_evidence_gaps'],
  EVIDENCE_REVIEW: ['get_foundry_state', ...recoveryTools, 'get_evidence_gaps', 'compare_evidence_policy', 'synthesize_insights'],
  INSIGHTS_READY: ['get_foundry_state', ...recoveryTools, 'get_evidence_gaps', 'compare_evidence_policy', 'synthesize_insights', 'generate_idea_candidates'],
  CANDIDATES_READY: ['get_foundry_state', ...recoveryTools, 'get_evidence_gaps', 'compare_evidence_policy', 'apply_evidence_policy', 'inspect_candidate', 'stress_test_candidate', 'revise_candidate', 'trace_evidence'],
  STRESS_TESTING: ['get_foundry_state', ...recoveryTools, 'get_evidence_gaps', 'compare_evidence_policy', 'apply_evidence_policy', 'inspect_candidate', 'stress_test_candidate', 'revise_candidate', 'trace_evidence', 'preview_finalization', 'finalize_blueprint_with_consent'],
  BLUEPRINT_READY: ['get_foundry_state', ...recoveryTools, 'get_evidence_gaps', 'compare_evidence_policy', 'apply_evidence_policy', 'inspect_candidate', 'revise_candidate', 'trace_evidence', 'preview_finalization', 'finalize_blueprint_with_consent'],
  FINALIZED: ['get_foundry_state', 'get_evidence_gaps', 'compare_evidence_policy', 'apply_evidence_policy', 'inspect_candidate', 'revise_candidate', 'trace_evidence', 'preview_export', 'export_blueprint_with_consent'],
};

export function activeToolNamesForStage(stage: WorkspaceStage): string[] {
  return [...stageTools[stage]];
}

const emptySchema = (): JSONSchema => ({ type: 'object', properties: {}, additionalProperties: false });
const objectSchema = (
  properties: JSONSchema['properties'],
  required: string[] = [],
): JSONSchema => ({ type: 'object', properties, ...(required.length ? { required } : {}), additionalProperties: false });

const stringProperty = (description: string, enumValues?: string[]) => ({
  type: 'string',
  description,
  ...(enumValues ? { enum: enumValues } : {}),
});
const stringArrayProperty = (description: string, enumValues?: string[]) => ({
  type: 'array',
  description,
  items: { type: 'string', ...(enumValues ? { enum: enumValues } : {}) },
  uniqueItems: true,
});

function compactData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      ids: data.slice(0, 8).map((item) => (
        typeof item === 'object' && item && 'id' in item ? String(item.id) : undefined
      )).filter(Boolean),
    };
  }
  if (!data || typeof data !== 'object') return data;
  const record = data as Record<string, unknown>;
  if (record.candidate && typeof record.candidate === 'object') {
    const candidate = record.candidate as Record<string, unknown>;
    return {
      candidate: Object.fromEntries(['id', 'name', 'oneLiner', 'mechanism', 'coverage', 'score', 'status', 'unsupportedComponents']
        .filter((key) => key in candidate)
        .map((key) => [key, candidate[key]])),
      link_ids: Array.isArray(record.links)
        ? record.links.slice(0, 8).map((link) => typeof link === 'object' && link && 'id' in link ? String(link.id) : undefined).filter(Boolean)
        : [],
    };
  }
  const keep = ['id', 'stage', 'version', 'name', 'title', 'filename', 'mimeType', 'selectedCandidateId', 'warnings', 'gaps', 'counts', 'recommendationChanged', 'baselineRanking', 'proposedRanking', 'eligibleFindingIds', 'excludedFindingIds'];
  const compact = Object.fromEntries(keep.filter((key) => key in record).map((key) => [key, record[key]]));
  return Object.keys(compact).length ? compact : { fields: Object.keys(record).slice(0, 12) };
}

function stringifyReceipt(payload: Record<string, unknown>): string {
  let text = JSON.stringify(payload);
  if (text.length <= MAX_TOOL_OUTPUT_CHARS) return text;
  text = JSON.stringify({ ...payload, data: compactData(payload.data) });
  if (text.length <= MAX_TOOL_OUTPUT_CHARS) return text;
  const error = payload.error && typeof payload.error === 'object' ? payload.error as Record<string, unknown> : undefined;
  const fallback = JSON.stringify({
    ok: payload.ok,
    workspace_version: payload.workspace_version,
    modified_ids: Array.isArray(payload.modified_ids) ? payload.modified_ids.slice(0, 8) : [],
    next_actions: Array.isArray(payload.next_actions) ? payload.next_actions.slice(0, 8) : [],
    ...(error ? { error: {
      code: error.code,
      message: typeof error.message === 'string' ? error.message.slice(0, 320) : 'The action could not be completed.',
      recoverable: error.recoverable,
    } } : {}),
    message: 'Receipt compacted. Read current state for details.',
  });
  if (fallback.length <= MAX_TOOL_OUTPUT_CHARS) return fallback;
  return JSON.stringify({
    ok: payload.ok,
    workspace_version: payload.workspace_version,
    modified_ids: [],
    next_actions: ['get_foundry_state'],
    ...(error ? { error: { code: error.code, recoverable: true } } : {}),
    message: 'Receipt compacted. Read current state for details.',
  });
}

function toolResult<T>(result: ServiceResult<T>): WebMCPToolResult {
  const shared = {
    workspace_version: result.workspaceVersion,
    modified_ids: result.ok ? result.modifiedIds : [],
    next_actions: result.nextActions,
  };
  if (!result.ok) {
    return {
      isError: true,
      content: [{ type: 'text', text: stringifyReceipt({
        ok: false,
        ...shared,
        error: { ...result.error, recoverable: true },
      }) }],
    };
  }
  return {
    content: [{ type: 'text', text: stringifyReceipt({
      ok: true,
      ...shared,
      message: result.message,
      data: result.data,
    }) }],
  };
}

function webActionResult(input: {
  ok: boolean;
  workspaceVersion: number;
  nextActions: string[];
  message: string;
  code?: string;
  data?: unknown;
}): WebMCPToolResult {
  return {
    ...(!input.ok ? { isError: true } : {}),
    content: [{ type: 'text', text: stringifyReceipt({
      ok: input.ok,
      workspace_version: input.workspaceVersion,
      modified_ids: [],
      next_actions: input.nextActions,
      ...(input.ok
        ? { message: input.message, data: input.data }
        : { error: { code: input.code, message: input.message, recoverable: true } }),
    }) }],
  };
}

function currentState(service: FoundryService) {
  const state = service.getFoundryState('agent');
  if (!state.ok) throw new Error(state.error.message);
  return state;
}

function staleOrUnavailableConsent(
  service: FoundryService,
  expectedVersion: number,
  requestConsent: RegisterOptions['requestConsent'],
): WebMCPToolResult | undefined {
  const state = currentState(service);
  if (expectedVersion !== state.workspaceVersion) {
    return webActionResult({
      ok: false,
      workspaceVersion: state.workspaceVersion,
      nextActions: ['get_foundry_state'],
      code: 'STALE_WORKSPACE_VERSION',
      message: `Expected workspace v${expectedVersion}, but the visible workspace is v${state.workspaceVersion}. Read state and preview again.`,
    });
  }
  if (!requestConsent) {
    return webActionResult({
      ok: false,
      workspaceVersion: state.workspaceVersion,
      nextActions: ['get_foundry_state'],
      code: 'HUMAN_CONSENT_UNAVAILABLE',
      message: 'The in-page human consent checkpoint is not connected.',
    });
  }
  return undefined;
}

const evidenceTypes: EvidenceType[] = [
  'first_party_behavioral', 'primary_user_evidence', 'primary_research', 'secondary_research',
  'market_signal', 'competitor_evidence', 'expert_opinion', 'community_anecdote',
  'derived_calculation', 'hypothesis', 'counter_evidence',
];
const lanes: SourceLane[] = ['first_party', 'customer', 'academic', 'market', 'alternatives', 'community', 'counter'];
const sourceTypes: Source['sourceType'][] = ['analytics', 'customer', 'paper', 'report', 'community', 'competitor', 'internal'];

const policyProperties = (): JSONSchema['properties'] => ({
  allowed_source_types: stringArrayProperty('Only findings from these source types remain eligible.', sourceTypes),
  earliest_published_at: stringProperty('Exclude sources published before this YYYY-MM-DD date.'),
  geography: stringProperty('Require findings to match this geography.'),
  minimum_corroboration: { type: 'integer', minimum: 1, maximum: 8, description: 'Distinct source families required per supported candidate component.' },
  include_private: { type: 'boolean', description: 'Whether explicitly authorized private evidence remains eligible. Set false when the user says exclude private evidence, public-only, omit private sources, or disallow private data.' },
});

function policyFromInput(input: Record<string, unknown>) {
  return {
    allowedSourceTypes: input.allowed_source_types as Source['sourceType'][] | undefined,
    earliestPublishedAt: input.earliest_published_at as string | undefined,
    geography: input.geography as string | undefined,
    minimumCorroboration: input.minimum_corroboration as number | undefined,
    includePrivate: input.include_private as boolean | undefined,
  };
}

export function getFoundryToolDefinitions(
  service: FoundryService,
  options: RegisterOptions = {},
): WebMCPToolDefinition[] {
  const definitions: WebMCPToolDefinition[] = [
    {
      name: 'get_foundry_state',
      description: 'Read the user-authored problem brief, active LaunchPad stage, record counts, quality warnings, and selected candidate. Call this first so every later action uses the human’s actual problem. This is a pure read and does not change the workspace.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: true },
      execute: () => toolResult(service.getFoundryState('agent')),
    },
    {
      name: 'research_and_ideate',
      description: 'Run the same server-side AI web-research workflow as the page: search the web for the actual problem, retain citation-linked supporting and counter evidence, build one problem-specific recommendation, stress-test it, and finalize the visible blueprint. Agent-started runs pause for visible, version-bound human approval before qualifying evidence and again before finalization. A request for a specific live result may pause for essential missing details instead of inventing an answer.',
      inputSchema: objectSchema({
        problem_statement: stringProperty('Problem to research. Omit when the user has already submitted it in the page.'),
      }),
      execute: async (input, execution) => {
        if (!options.onResearch) {
          const state = currentState(service);
          return webActionResult({ ok: false, workspaceVersion: state.workspaceVersion, nextActions: state.nextActions, code: 'AUTONOMOUS_RUN_UNAVAILABLE', message: 'The autonomous research runner is not connected.' });
        }
        const completed = await options.onResearch(input.problem_statement as string | undefined, execution?.signal);
        const state = currentState(service);
        return webActionResult(completed
          ? { ok: true, workspaceVersion: state.workspaceVersion, nextActions: state.nextActions, message: 'The evidence-backed solution is ready and visible in LaunchPad.' }
          : { ok: false, workspaceVersion: state.workspaceVersion, nextActions: state.nextActions, code: 'AUTONOMOUS_RUN_FAILED', message: 'The research run did not complete. Inspect the visible retry state.' });
      },
    },
    {
      name: 'update_problem_brief',
      description: 'Create or revise the active structured problem brief. This visibly updates the Problem Hopper and moves the workspace to PROBLEM_DEFINED.',
      inputSchema: objectSchema({
        problem_type: stringProperty('Kind of decision or opportunity.'),
        problem_statement: stringProperty('Concrete problem statement. Required when the brief is empty.'),
        target_audience: stringProperty('Specific affected audience.'),
        desired_outcome: stringProperty('Observable outcome sought.'),
        current_behavior: stringProperty('What the audience does today.'),
        constraints: stringArrayProperty('Implementation, policy, resource, or timing constraints.'),
        geography: stringProperty('Relevant geography.'),
        timeframe: stringProperty('Decision or delivery timeframe.'),
        excluded_approaches: stringArrayProperty('Approaches that must not be recommended.'),
        decision_criteria: stringArrayProperty('Criteria used to compare recommendations.'),
      }),
      execute: (input) => toolResult(service.updateProblemBrief({
        problemType: input.problem_type as string | undefined,
        problemStatement: input.problem_statement as string | undefined,
        targetAudience: input.target_audience as string | undefined,
        desiredOutcome: input.desired_outcome as string | undefined,
        currentBehavior: input.current_behavior as string | undefined,
        constraints: input.constraints as string[] | undefined,
        geography: input.geography as string | undefined,
        timeframe: input.timeframe as string | undefined,
        excludedApproaches: input.excluded_approaches as string[] | undefined,
        decisionCriteria: input.decision_criteria as string[] | undefined,
      } satisfies Partial<ProblemBrief>, 'agent')),
    },
    {
      name: 'plan_research',
      description: 'Turn the active brief into six inspectable research questions across approved source lanes. This activates the planning station.',
      inputSchema: objectSchema({ focus: stringProperty('Optional research focus to emphasize.') }),
      execute: (input) => toolResult(service.planResearch({ focus: input.focus as string | undefined }, 'agent')),
    },
    {
      name: 'search_sources',
      description: 'Search one connected source lane for the active research plan. Use this for first-party data, customer evidence, academic research, market and alternative products, community conversations, or counter-evidence. Connected results become deduplicated source crates; when no adapter results exist, use browser research or an authorized connection followed by import_source. Never treat a community anecdote as prevalence, and never claim access to private analytics without an explicit source.',
      inputSchema: objectSchema({
        lane: stringProperty('Single source lane to search.', lanes),
        query: stringProperty('Optional narrow query for this lane.'),
      }, ['lane']),
      annotations: { untrustedContentHint: true },
      execute: (input) => toolResult(service.searchSources({ lane: input.lane as SourceLane, query: input.query as string | undefined }, 'agent')),
    },
    {
      name: 'import_source',
      description: 'Import one URL, pasted excerpt, uploaded-document identifier, or connected-data result. This adds one source crate; it does not automatically accept evidence.',
      inputSchema: objectSchema({
        title: stringProperty('Human-readable source title.'),
        source_type: stringProperty('Source format or origin.', sourceTypes),
        url: stringProperty('Public HTTP(S) URL or document identifier.'),
        excerpt: stringProperty('Exact user-provided passage when the full source is unavailable.'),
        lane: stringProperty('Evidence lane for the source.', lanes),
        private: { type: 'boolean', description: 'Whether the source contains private evidence.' },
        synthetic: { type: 'boolean', description: 'Whether this is disclosed synthetic demo evidence.' },
        author: stringProperty('Author list when known.'),
        publisher: stringProperty('Publisher or venue owner when known.'),
        published_at: stringProperty('Publication date in YYYY-MM-DD form when known.'),
      }, ['title', 'source_type']),
      annotations: { untrustedContentHint: true },
      execute: (input) => toolResult(service.importSource({
        title: input.title as string,
        sourceType: input.source_type as Source['sourceType'],
        url: input.url as string | undefined,
        excerpt: input.excerpt as string | undefined,
        lane: input.lane as SourceLane | undefined,
        private: input.private as boolean | undefined,
        synthetic: input.synthetic as boolean | undefined,
        author: input.author as string | undefined,
        publisher: input.publisher as string | undefined,
        publishedAt: input.published_at as string | undefined,
      }, 'agent')),
    },
    {
      name: 'ingest_evidence_batch',
      description: 'Atomically ingest one to eight browser-found, user-provided, or explicitly authorized private evidence records. Every item must declare its origin, retrieval method, retrieval time, and permission scope; the whole batch is rejected if any item is invalid.',
      inputSchema: objectSchema({
        items: {
          type: 'array',
          minItems: 1,
          maxItems: 8,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'source_type', 'lane', 'excerpt', 'provenance'],
            properties: {
              title: { type: 'string' },
              source_type: { type: 'string', enum: sourceTypes },
              lane: { type: 'string', enum: lanes },
              url: { type: 'string' },
              excerpt: { type: 'string' },
              excerpt_kind: { type: 'string', enum: ['verbatim', 'ai_web_synthesis'] },
              private: { type: 'boolean' },
              synthetic: { type: 'boolean' },
              author: { type: 'string' },
              publisher: { type: 'string' },
              published_at: { type: 'string' },
              provenance: {
                type: 'object',
                additionalProperties: false,
                required: ['origin', 'retrieved_at', 'retrieval_method'],
                properties: {
                  origin: { type: 'string', enum: ['public_web', 'user_provided', 'connected_private', 'first_party'] },
                  retrieved_at: { type: 'string' },
                  retrieval_method: { type: 'string', enum: ['browser_agent', 'authorized_connector', 'paste', 'upload', 'system_research'] },
                  permission_scope: { type: 'string', enum: ['public', 'user_authorized'] },
                },
              },
            },
          },
        },
      }, ['items']),
      annotations: { untrustedContentHint: true },
      execute: (input) => {
        const items = (input.items as Array<Record<string, unknown>>).map((item) => {
          const provenance = item.provenance as Record<string, unknown>;
          return {
            title: item.title as string,
            sourceType: item.source_type as Source['sourceType'],
            lane: item.lane as SourceLane,
            url: item.url as string | undefined,
            excerpt: item.excerpt as string,
            excerptKind: item.excerpt_kind as Source['providedExcerptKind'] | undefined,
            private: item.private as boolean | undefined,
            synthetic: item.synthetic as boolean | undefined,
            author: item.author as string | undefined,
            publisher: item.publisher as string | undefined,
            publishedAt: item.published_at as string | undefined,
            provenance: {
              origin: provenance.origin,
              retrievedAt: provenance.retrieved_at,
              retrievalMethod: provenance.retrieval_method,
              permissionScope: provenance.permission_scope,
            },
          } as EvidenceBatchItem;
        });
        return toolResult(service.ingestEvidenceBatch({ items }, 'agent'));
      },
    },
    {
      name: 'extract_findings',
      description: 'Extract atomic, traceable findings from selected sources. Every finding keeps its source excerpt and lineage; community, market, and analytics evidence are valid source types but must retain their evidence category and limitations. This moves new findings into the human inspection bay as pending evidence.',
      inputSchema: objectSchema({ source_ids: stringArrayProperty('Specific source IDs; omit to process all available sources.') }),
      annotations: { untrustedContentHint: true },
      execute: (input) => toolResult(service.extractFindings({ sourceIds: input.source_ids as string[] | undefined }, 'agent')),
    },
    {
      name: 'review_evidence_with_consent',
      description: 'Preview an exact evidence decision, pause for a visible human approval bound to the current workspace version, then accept, reject, or qualify only those finding IDs. Decline, abort, or stale state leaves evidence unchanged.',
      inputSchema: objectSchema({
        decision: stringProperty('Human-authorized evidence decision.', ['accept', 'reject', 'qualify']),
        finding_ids: stringArrayProperty('Exact findings to review.'),
        note: stringProperty('Reason for the decision.'),
        expected_workspace_version: { type: 'integer', minimum: 1, description: 'Workspace version observed during preview.' },
      }, ['decision', 'finding_ids', 'expected_workspace_version']),
      annotations: { untrustedContentHint: true },
      execute: async (input, execution) => {
        const expectedVersion = input.expected_workspace_version as number;
        const preflight = staleOrUnavailableConsent(service, expectedVersion, options.requestConsent);
        if (preflight) return preflight;
        const findingIds = [...new Set(input.finding_ids as string[])];
        const before = currentState(service);
        const approved = await options.requestConsent!({
          kind: 'review_evidence',
          title: `${String(input.decision) === 'accept' ? 'Accept' : String(input.decision) === 'reject' ? 'Reject' : 'Qualify'} browser-found evidence?`,
          summary: `The browser agent wants to ${String(input.decision)} ${findingIds.length} exact finding${findingIds.length === 1 ? '' : 's'}.`,
          affectedIds: findingIds,
          privacyScope: before.data.counts.privateSources > 0 ? 'includes_private' : 'public_only',
          workspaceVersion: expectedVersion,
        }, execution?.signal);
        if (!approved) return webActionResult({
          ok: false,
          workspaceVersion: currentState(service).workspaceVersion,
          nextActions: ['get_foundry_state'],
          code: execution?.signal?.aborted ? 'ACTION_ABORTED' : 'USER_DECLINED',
          message: execution?.signal?.aborted ? 'The consent request was cancelled.' : 'The human declined the evidence decision; no evidence changed.',
        });
        const staleAfterConsent = staleOrUnavailableConsent(service, expectedVersion, options.requestConsent);
        if (staleAfterConsent) return staleAfterConsent;
        return toolResult(service.reviewFindings({
          decision: input.decision as 'accept' | 'reject' | 'qualify',
          findingIds,
          note: input.note as string | undefined,
        }, 'agent'));
      },
    },
    {
      name: 'get_evidence_gaps',
      description: 'Read missing quality gates, weak evidence concentration, and contradiction warnings. This is a pure read and does not change the workspace.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => toolResult(service.getEvidenceGaps('agent')),
    },
    {
      name: 'compare_evidence_policy',
      description: 'Purely compare the current candidate ranking with a counterfactual evidence policy. Filters can restrict source types, recency, geography, corroboration, and private evidence without changing review decisions or deleting evidence.',
      inputSchema: objectSchema(policyProperties()),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (input) => {
        const result = service.compareEvidencePolicy({ policy: policyFromInput(input) }, 'agent');
        if (result.ok) options.onPolicyComparison?.(result.data, result.workspaceVersion);
        return toolResult(result);
      },
    },
    {
      name: 'apply_evidence_policy',
      description: 'Apply a previously inspected evidence policy non-destructively, recalculate coverage and ranking, and retain the complete evidence ledger for rollback.',
      inputSchema: objectSchema(policyProperties()),
      annotations: { untrustedContentHint: true },
      execute: (input) => toolResult(service.applyEvidencePolicy({ policy: policyFromInput(input) }, 'agent')),
    },
    {
      name: 'synthesize_insights',
      description: 'Cluster accepted findings into inspectable opportunity themes while retaining contradictions. This visibly assembles the insight station.',
      inputSchema: emptySchema(),
      annotations: { untrustedContentHint: true },
      execute: () => toolResult(service.synthesizeInsights({}, 'agent')),
    },
    {
      name: 'generate_idea_candidates',
      description: 'Create one to three problem-specific, evidence-linked candidates from accepted findings and constraints. An agent should pass its structured candidate proposals so LaunchPad can validate, store, score, and render them in the visible forge.',
      inputSchema: objectSchema({
        count: { type: 'integer', enum: [1, 2, 3], minimum: 1, maximum: 3, description: 'Number of candidates to create when structured proposals are omitted.' },
        proposals: {
          type: 'array',
          description: 'One to three problem-specific candidate proposals derived from the accepted evidence.',
          minItems: 1,
          maxItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'one_liner', 'mechanism', 'features'],
            properties: {
              name: { type: 'string', description: 'Memorable candidate name.' },
              one_liner: { type: 'string', description: 'One-sentence proposition.' },
              target_user: { type: 'string', description: 'Specific target user; defaults to the active brief.' },
              problem: { type: 'string', description: 'Problem addressed; defaults to the active problem statement.' },
              mechanism: { type: 'string', description: 'Why this intervention may work.' },
              workflow: { type: 'array', items: { type: 'string' }, description: 'Ordered user workflow.' },
              features: {
                type: 'array',
                minItems: 1,
                maxItems: 4,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['name', 'description'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
              expected_outcome: { type: 'string' },
              implementation_constraints: { type: 'array', items: { type: 'string' } },
              differentiation: { type: 'string' },
              assumptions: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['statement'],
                  properties: {
                    statement: { type: 'string' },
                    importance: { type: 'string', enum: ['critical', 'high', 'medium'] },
                    validation_method: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      }),
      annotations: { untrustedContentHint: true },
      execute: (input) => {
        const proposals = (input.proposals as Array<Record<string, unknown>> | undefined)?.map((proposal) => ({
          name: proposal.name as string,
          oneLiner: proposal.one_liner as string,
          targetUser: proposal.target_user as string | undefined,
          problem: proposal.problem as string | undefined,
          mechanism: proposal.mechanism as string,
          workflow: proposal.workflow as string[] | undefined,
          features: proposal.features as IdeaCandidateProposal['features'],
          expectedOutcome: proposal.expected_outcome as string | undefined,
          implementationConstraints: proposal.implementation_constraints as string[] | undefined,
          differentiation: proposal.differentiation as string | undefined,
          assumptions: (proposal.assumptions as Array<Record<string, unknown>> | undefined)?.map((assumption) => ({
            statement: assumption.statement as string,
            importance: assumption.importance as 'critical' | 'high' | 'medium' | undefined,
            validationMethod: assumption.validation_method as string | undefined,
          })),
        }));
        return toolResult(service.generateIdeaCandidates({
          count: input.count as 1 | 2 | 3 | undefined,
          proposals,
        }, 'agent'));
      },
    },
    {
      name: 'inspect_candidate',
      description: 'Read one candidate, its support coverage, evidence links, and unsupported components. This is a pure read and does not change the workspace.',
      inputSchema: objectSchema({ candidate_id: stringProperty('Candidate ID to inspect.') }, ['candidate_id']),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (input) => toolResult(service.inspectCandidate({ candidateId: input.candidate_id as string }, 'agent')),
    },
    {
      name: 'stress_test_candidate',
      description: 'Challenge one candidate with accepted counter-evidence, adoption risks, feasibility risks, and population warnings. This activates the stress chamber.',
      inputSchema: objectSchema({ candidate_id: stringProperty('Candidate ID to challenge.') }, ['candidate_id']),
      annotations: { untrustedContentHint: true },
      execute: (input) => toolResult(service.stressTestCandidate({ candidateId: input.candidate_id as string }, 'agent')),
    },
    {
      name: 'revise_candidate',
      description: 'Revise one candidate under explicit constraints while preserving lineage. Excluded evidence categories are removed only from that candidate’s support links; human review decisions and the shared evidence ledger remain unchanged.',
      inputSchema: objectSchema({
        candidate_id: stringProperty('Candidate ID to revise.'),
        instruction: stringProperty('Concrete revision instruction.'),
        constraints: stringArrayProperty('Additional constraints the candidate must retain.'),
        exclude_evidence_types: stringArrayProperty('Evidence categories to exclude from support.', evidenceTypes),
      }, ['candidate_id', 'instruction']),
      annotations: { untrustedContentHint: true },
      execute: (input) => toolResult(service.reviseCandidate({
        candidateId: input.candidate_id as string,
        instruction: input.instruction as string,
        constraints: input.constraints as string[] | undefined,
        excludeEvidenceTypes: input.exclude_evidence_types as EvidenceType[] | undefined,
      }, 'agent')),
    },
    {
      name: 'trace_evidence',
      description: 'Trace and record the complete idea-component to insight to finding to source proof path. This action adds a compact Activity receipt and highlights the path in the visible blueprint.',
      inputSchema: objectSchema({
        candidate_id: stringProperty('Candidate ID whose proof path is requested.'),
        component_path: stringProperty('Component path such as mechanism or features.0.'),
      }, ['candidate_id', 'component_path']),
      annotations: { untrustedContentHint: true },
      execute: (input) => {
        const result = service.traceEvidence({ candidateId: input.candidate_id as string, componentPath: input.component_path as string }, 'agent');
        if (result.ok) options.onTrace?.(result.data.nodes);
        return toolResult(result);
      },
    },
    {
      name: 'preview_finalization',
      description: 'Purely preview whether a stress-tested candidate can be finalized, including remaining evidence gaps and unsupported components. Use the returned workspace version for the consent-bound commit.',
      inputSchema: objectSchema({ candidate_id: stringProperty('Stress-tested candidate ID to finalize.') }, ['candidate_id']),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (input) => {
        const candidate = service.inspectCandidate({ candidateId: input.candidate_id as string }, 'agent');
        if (!candidate.ok) return toolResult(candidate);
        const gaps = service.getEvidenceGaps('agent');
        if (!gaps.ok) return toolResult(gaps);
        const state = currentState(service);
        return webActionResult({
          ok: true,
          workspaceVersion: state.workspaceVersion,
          nextActions: ['finalize_blueprint_with_consent'],
          message: gaps.data.gaps.length || candidate.data.candidate.unsupportedComponents.length
            ? 'Finalization is blocked; close the listed evidence gaps first.'
            : 'Finalization is ready for a human consent checkpoint.',
          data: {
            candidateId: candidate.data.candidate.id,
            canFinalize: gaps.data.gaps.length === 0 && candidate.data.candidate.unsupportedComponents.length === 0,
            gaps: gaps.data.gaps,
            unsupportedComponents: candidate.data.candidate.unsupportedComponents,
          },
        });
      },
    },
    {
      name: 'finalize_blueprint_with_consent',
      description: 'After preview, pause for visible human approval bound to the exact workspace version, recheck for stale state, then lock the selected candidate into a proof-carrying blueprint.',
      inputSchema: objectSchema({
        candidate_id: stringProperty('Stress-tested candidate ID to finalize.'),
        expected_workspace_version: { type: 'integer', minimum: 1, description: 'Workspace version returned by preview_finalization.' },
      }, ['candidate_id', 'expected_workspace_version']),
      annotations: { untrustedContentHint: true },
      execute: async (input, execution) => {
        const expectedVersion = input.expected_workspace_version as number;
        const preflight = staleOrUnavailableConsent(service, expectedVersion, options.requestConsent);
        if (preflight) return preflight;
        const candidateId = input.candidate_id as string;
        const approved = await options.requestConsent!({
          kind: 'finalize_blueprint',
          title: 'Finalize this evidence-backed blueprint?',
          summary: 'Finalization locks the selected recommendation and validation plan into the visible workspace.',
          affectedIds: [candidateId],
          privacyScope: currentState(service).data.counts.privateSources > 0 ? 'includes_private' : 'public_only',
          workspaceVersion: expectedVersion,
        }, execution?.signal);
        if (!approved) return webActionResult({ ok: false, workspaceVersion: currentState(service).workspaceVersion, nextActions: ['preview_finalization'], code: execution?.signal?.aborted ? 'ACTION_ABORTED' : 'USER_DECLINED', message: 'Finalization was not approved; the workspace is unchanged.' });
        const staleAfterConsent = staleOrUnavailableConsent(service, expectedVersion, options.requestConsent);
        if (staleAfterConsent) return staleAfterConsent;
        return toolResult(service.finalizeBlueprint({ candidateId }, 'agent'));
      },
    },
    {
      name: 'preview_export',
      description: 'Purely preview a public-safe or private-inclusive blueprint export and return the workspace version required for commit. No file is created by this preview.',
      inputSchema: objectSchema({
        format: stringProperty('Export format.', ['markdown', 'json']),
        include_private: { type: 'boolean', description: 'Preview inclusion of private sources; the commit requires explicit human consent.' },
      }, ['format']),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (input) => {
        const state = currentState(service);
        return webActionResult({
          ok: true,
          workspaceVersion: state.workspaceVersion,
          nextActions: ['export_blueprint_with_consent'],
          message: state.data.stage === 'FINALIZED' ? 'Export is ready to commit.' : 'Finalize the blueprint before export.',
          data: { format: input.format, includePrivate: Boolean(input.include_private), canExport: state.data.stage === 'FINALIZED' },
        });
      },
    },
    {
      name: 'export_blueprint_with_consent',
      description: 'Commit a previewed export. Public-safe exports exclude private evidence; private-inclusive exports pause for visible human consent and recheck the workspace version before placing the full file in the download surface.',
      inputSchema: objectSchema({
        format: stringProperty('Export format.', ['markdown', 'json']),
        include_private: { type: 'boolean', description: 'Include private sources only after explicit human authorization.' },
        expected_workspace_version: { type: 'integer', minimum: 1, description: 'Workspace version returned by preview_export.' },
      }, ['format', 'expected_workspace_version']),
      annotations: { untrustedContentHint: true },
      execute: async (input, execution) => {
        const expectedVersion = input.expected_workspace_version as number;
        const current = currentState(service);
        if (current.workspaceVersion !== expectedVersion) return staleOrUnavailableConsent(service, expectedVersion, options.requestConsent)
          ?? webActionResult({ ok: false, workspaceVersion: current.workspaceVersion, nextActions: ['preview_export'], code: 'STALE_WORKSPACE_VERSION', message: 'Preview the export again.' });
        if (input.include_private) {
          const preflight = staleOrUnavailableConsent(service, expectedVersion, options.requestConsent);
          if (preflight) return preflight;
          const approved = await options.requestConsent!({
            kind: 'export_private_evidence',
            title: 'Export private evidence?',
            summary: 'The browser agent wants to place a file containing explicitly authorized private evidence in the download surface.',
            affectedIds: [current.data.selectedCandidate?.id ?? current.data.workspaceId],
            privacyScope: 'includes_private',
            workspaceVersion: expectedVersion,
          }, execution?.signal);
          if (!approved) return webActionResult({ ok: false, workspaceVersion: currentState(service).workspaceVersion, nextActions: ['preview_export'], code: execution?.signal?.aborted ? 'ACTION_ABORTED' : 'USER_DECLINED', message: 'Private export was not approved; no file was created.' });
          const staleAfterConsent = staleOrUnavailableConsent(service, expectedVersion, options.requestConsent);
          if (staleAfterConsent) return staleAfterConsent;
        }
        const result = service.exportBlueprint({ format: input.format as 'markdown' | 'json', includePrivate: input.include_private as boolean | undefined }, 'agent');
        if (result.ok) options.onExport?.(result.data);
        return toolResult(result);
      },
    },
  ];
  const activeNames = new Set(activeToolNamesForStage(options.stage ?? 'EMPTY'));
  return definitions
    .filter((definition) => activeNames.has(definition.name))
    .map((definition) => ({
      ...definition,
      title: definition.title ?? definition.name.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '),
    }));
}

export function registerFoundryTools(
  modelContext: ModelContextLike,
  service: FoundryService,
  options: RegisterOptions = {},
): WebMCPRegistration {
  const definitions = getFoundryToolDefinitions(service, options);
  const controller = new AbortController();
  const registrations = definitions.map((definition) => Promise.resolve()
    .then(() => modelContext.registerTool(definition, { signal: controller.signal })));
  const ready = Promise.all(registrations)
    .then(() => undefined)
    .catch((error: unknown) => {
      controller.abort();
      throw error;
    });
  return {
    ready,
    dispose: () => controller.abort(),
    toolNames: definitions.map((definition) => definition.name),
  };
}
