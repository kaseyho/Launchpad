import type { FoundryService } from '../domain/foundry-service';
import type { EvidenceType, ProblemBrief, ServiceResult, Source, SourceLane, TraceNode } from '../domain/types';

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
  description: string;
  inputSchema: JSONSchema;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<WebMCPToolResult> | WebMCPToolResult;
}

export interface ModelContextLike {
  registerTool: (definition: WebMCPToolDefinition) => void;
  unregisterTool?: (name: string) => void;
}

interface RegisterOptions {
  onTrace?: (nodes: TraceNode[]) => void;
  onExport?: (file: { filename: string; mimeType: string; content: string }) => void;
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

function toolResult<T>(result: ServiceResult<T>): WebMCPToolResult {
  if (!result.ok) {
    return {
      isError: true,
      content: [{ type: 'text', text: JSON.stringify({ ok: false, ...result.error }, null, 2) }],
    };
  }
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ ok: true, message: result.message, modified_ids: result.modifiedIds, data: result.data }, null, 2),
    }],
  };
}

const evidenceTypes: EvidenceType[] = [
  'first_party_behavioral', 'primary_user_evidence', 'primary_research', 'secondary_research',
  'market_signal', 'competitor_evidence', 'expert_opinion', 'community_anecdote',
  'derived_calculation', 'hypothesis', 'counter_evidence',
];
const lanes: SourceLane[] = ['first_party', 'customer', 'academic', 'market', 'alternatives', 'community', 'counter'];
const sourceTypes: Source['sourceType'][] = ['analytics', 'customer', 'paper', 'report', 'community', 'competitor', 'internal'];

export function getFoundryToolDefinitions(
  service: FoundryService,
  options: RegisterOptions = {},
): WebMCPToolDefinition[] {
  return [
    {
      name: 'get_foundry_state',
      description: 'Read the active ProofFoundry stage, record counts, quality warnings, and selected candidate. This only records an audit event and does not change research decisions.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: true },
      execute: () => toolResult(service.getFoundryState('agent')),
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
      description: 'Search one approved source lane for the active research plan. This adds deduplicated source crates to the live factory.',
      inputSchema: objectSchema({
        lane: stringProperty('Single source lane to search.', lanes),
        query: stringProperty('Optional narrow query for this lane.'),
      }, ['lane']),
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
      }, ['title', 'source_type']),
      execute: (input) => toolResult(service.importSource({
        title: input.title as string,
        sourceType: input.source_type as Source['sourceType'],
        url: input.url as string | undefined,
        excerpt: input.excerpt as string | undefined,
        lane: input.lane as SourceLane | undefined,
        private: input.private as boolean | undefined,
        synthetic: input.synthetic as boolean | undefined,
      }, 'agent')),
    },
    {
      name: 'extract_findings',
      description: 'Extract atomic, citation-complete findings from selected sources. This moves new findings into the human inspection bay as pending evidence.',
      inputSchema: objectSchema({ source_ids: stringArrayProperty('Specific source IDs; omit to process all available sources.') }),
      execute: (input) => toolResult(service.extractFindings({ sourceIds: input.source_ids as string[] | undefined }, 'agent')),
    },
    {
      name: 'review_findings',
      description: 'Accept, reject, or qualify matched findings. This changes evidence lanes, recalculates candidate support, and preserves the review in the activity log.',
      inputSchema: objectSchema({
        decision: stringProperty('Human-authorized evidence decision.', ['accept', 'reject', 'qualify']),
        finding_ids: stringArrayProperty('Exact findings to review.'),
        evidence_type: stringProperty('Optional category filter used instead of individual IDs.', evidenceTypes),
        note: stringProperty('Reason for the decision.'),
      }, ['decision']),
      execute: (input) => toolResult(service.reviewFindings({
        decision: input.decision as 'accept' | 'reject' | 'qualify',
        findingIds: input.finding_ids as string[] | undefined,
        evidenceType: input.evidence_type as EvidenceType | undefined,
        note: input.note as string | undefined,
      }, 'agent')),
    },
    {
      name: 'get_evidence_gaps',
      description: 'Read missing quality gates, weak evidence concentration, and contradiction warnings. This only records an audit event.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: true },
      execute: () => toolResult(service.getEvidenceGaps('agent')),
    },
    {
      name: 'synthesize_insights',
      description: 'Cluster accepted findings into inspectable opportunity themes while retaining contradictions. This visibly assembles the insight station.',
      inputSchema: emptySchema(),
      execute: () => toolResult(service.synthesizeInsights({}, 'agent')),
    },
    {
      name: 'generate_idea_candidates',
      description: 'Generate one to three evidence-linked idea candidates from accepted findings and constraints. This populates the visible candidate forge.',
      inputSchema: objectSchema({ count: { type: 'integer', enum: [1, 2, 3], minimum: 1, maximum: 3, description: 'Number of candidates to create.' } }),
      execute: (input) => toolResult(service.generateIdeaCandidates({ count: input.count as 1 | 2 | 3 | undefined }, 'agent')),
    },
    {
      name: 'inspect_candidate',
      description: 'Read one candidate, its support coverage, evidence links, and unsupported components. This only records an audit event.',
      inputSchema: objectSchema({ candidate_id: stringProperty('Candidate ID to inspect.') }, ['candidate_id']),
      annotations: { readOnlyHint: true },
      execute: (input) => toolResult(service.inspectCandidate({ candidateId: input.candidate_id as string }, 'agent')),
    },
    {
      name: 'stress_test_candidate',
      description: 'Challenge one candidate with accepted counter-evidence, adoption risks, feasibility risks, and population warnings. This activates the stress chamber.',
      inputSchema: objectSchema({ candidate_id: stringProperty('Candidate ID to challenge.') }, ['candidate_id']),
      execute: (input) => toolResult(service.stressTestCandidate({ candidateId: input.candidate_id as string }, 'agent')),
    },
    {
      name: 'revise_candidate',
      description: 'Revise a candidate under explicit constraints while preserving lineage. Excluded evidence categories are rejected and all candidate scores are recalculated.',
      inputSchema: objectSchema({
        candidate_id: stringProperty('Candidate ID to revise.'),
        instruction: stringProperty('Concrete revision instruction.'),
        constraints: stringArrayProperty('Additional constraints the candidate must retain.'),
        exclude_evidence_types: stringArrayProperty('Evidence categories to exclude from support.', evidenceTypes),
      }, ['candidate_id', 'instruction']),
      execute: (input) => toolResult(service.reviseCandidate({
        candidateId: input.candidate_id as string,
        instruction: input.instruction as string,
        constraints: input.constraints as string[] | undefined,
        excludeEvidenceTypes: input.exclude_evidence_types as EvidenceType[] | undefined,
      }, 'agent')),
    },
    {
      name: 'trace_evidence',
      description: 'Read the complete idea-component to insight to finding to source proof path. The path is also highlighted in the visible blueprint.',
      inputSchema: objectSchema({
        candidate_id: stringProperty('Candidate ID whose proof path is requested.'),
        component_path: stringProperty('Component path such as mechanism or features.0.'),
      }, ['candidate_id', 'component_path']),
      annotations: { readOnlyHint: true },
      execute: (input) => {
        const result = service.traceEvidence({ candidateId: input.candidate_id as string, componentPath: input.component_path as string }, 'agent');
        if (result.ok) options.onTrace?.(result.data.nodes);
        return toolResult(result);
      },
    },
    {
      name: 'finalize_blueprint',
      description: 'Lock a stress-tested candidate into a versioned proof-carrying blueprint after all evidence gates pass. This activates the blueprint printer.',
      inputSchema: objectSchema({ candidate_id: stringProperty('Stress-tested candidate ID to finalize.') }, ['candidate_id']),
      execute: (input) => toolResult(service.finalizeBlueprint({ candidateId: input.candidate_id as string }, 'agent')),
    },
    {
      name: 'export_blueprint',
      description: 'Produce a Markdown or JSON blueprint export. Private evidence is excluded by default and included only when explicitly requested.',
      inputSchema: objectSchema({
        format: stringProperty('Export format.', ['markdown', 'json']),
        include_private: { type: 'boolean', description: 'Include private sources only when the user explicitly authorizes it.' },
      }, ['format']),
      execute: (input) => {
        const result = service.exportBlueprint({ format: input.format as 'markdown' | 'json', includePrivate: input.include_private as boolean | undefined }, 'agent');
        if (result.ok) options.onExport?.(result.data);
        return toolResult(result);
      },
    },
  ];
}

export function registerFoundryTools(
  modelContext: ModelContextLike,
  service: FoundryService,
  options: RegisterOptions = {},
) {
  const definitions = getFoundryToolDefinitions(service, options);
  for (const definition of definitions) modelContext.registerTool(definition);
  return () => {
    for (const definition of definitions) modelContext.unregisterTool?.(definition.name);
  };
}
