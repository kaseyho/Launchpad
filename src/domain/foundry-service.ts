import { DEMO_FIXTURES, RESEARCH_QUESTION_TEMPLATES, createCandidateFixtures } from './demo-data';
import type {
  Actor,
  Blueprint,
  EvidenceBatchItem,
  EvidenceGapAction,
  EvidencePolicy,
  EvidencePolicyComparison,
  EvidenceType,
  Finding,
  FoundryWorkspace,
  IdeaCandidate,
  IdeaCandidateProposal,
  ProblemBrief,
  ServiceFailure,
  ServiceResult,
  Source,
  SourceLane,
  TraceNode,
  ValidationPlan,
} from './types';

const clone = <T,>(value: T): T => structuredClone(value);
const now = () => new Date().toISOString();

const DEFAULT_BRIEF: ProblemBrief = {
  problemType: 'product opportunity',
  problemStatement: '',
  targetAudience: '',
  desiredOutcome: '',
  currentBehavior: '',
  constraints: [],
  geography: 'Not specified',
  timeframe: '',
  excludedApproaches: [],
  decisionCriteria: ['Evidence strength', 'Six-week feasibility', 'Activation impact'],
  openQuestions: [],
};

export function createInitialWorkspace(): FoundryWorkspace {
  const timestamp = now();
  return {
    id: 'workspace-demo',
    title: 'Untitled problem',
    stage: 'EMPTY',
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    problemBrief: clone(DEFAULT_BRIEF),
    researchQuestions: [],
    sources: [],
    findings: [],
    insights: [],
    candidates: [],
    evidenceLinks: [],
    activity: [{
      id: 'event-1',
      actor: 'system',
      toolName: 'initialize_foundry',
      inputSummary: 'Created an empty workspace.',
      outputSummary: 'Factory ready for a problem brief.',
      createdAt: timestamp,
      workspaceVersion: 1,
      status: 'success',
    }],
  };
}

export interface FoundryStateSummary {
  workspaceId: string;
  title: string;
  stage: FoundryWorkspace['stage'];
  version: number;
  problemBrief: ProblemBrief;
  counts: {
    researchQuestions: number;
    sources: number;
    findings: number;
    acceptedFindings: number;
    insights: number;
    candidates: number;
    contradictions: number;
    unsupportedComponents: number;
    privateSources: number;
  };
  selectedCandidate?: { id: string; name: string; coverage: number; score: number };
  warnings: string[];
}

export interface FoundryService {
  getFoundryState(actor?: Actor): ServiceResult<FoundryStateSummary>;
  updateProblemBrief(input: Partial<ProblemBrief>, actor?: Actor): ServiceResult<ProblemBrief>;
  planResearch(input?: { focus?: string }, actor?: Actor): ServiceResult<FoundryWorkspace['researchQuestions']>;
  searchSources(input: { lane: SourceLane; query?: string }, actor?: Actor): ServiceResult<Source[]>;
  importSource(input: {
    title: string;
    sourceType: Source['sourceType'];
    url?: string;
    excerpt?: string;
    excerptKind?: Source['providedExcerptKind'];
    lane?: SourceLane;
    private?: boolean;
    synthetic?: boolean;
    author?: string;
    publisher?: string;
    publishedAt?: string;
  }, actor?: Actor): ServiceResult<Source>;
  ingestEvidenceBatch(input: { items: EvidenceBatchItem[] }, actor?: Actor): ServiceResult<{ createdIds: string[]; existingIds: string[]; sources: Source[] }>;
  extractFindings(input: { sourceIds?: string[] }, actor?: Actor): ServiceResult<Finding[]>;
  reviewFindings(input: {
    decision: 'accept' | 'reject' | 'qualify';
    findingIds?: string[];
    evidenceType?: EvidenceType;
    note?: string;
  }, actor?: Actor): ServiceResult<Finding[]>;
  getEvidenceGaps(actor?: Actor): ServiceResult<{ gaps: string[]; warnings: string[]; nextActions: EvidenceGapAction[] }>;
  compareEvidencePolicy(input: { policy: Partial<EvidencePolicy> }, actor?: Actor): ServiceResult<EvidencePolicyComparison>;
  applyEvidencePolicy(input: { policy: Partial<EvidencePolicy> }, actor?: Actor): ServiceResult<EvidencePolicyComparison>;
  synthesizeInsights(input?: Record<string, never>, actor?: Actor): ServiceResult<FoundryWorkspace['insights']>;
  generateIdeaCandidates(input?: { count?: 1 | 2 | 3; proposals?: IdeaCandidateProposal[] }, actor?: Actor): ServiceResult<IdeaCandidate[]>;
  inspectCandidate(input: { candidateId: string }, actor?: Actor): ServiceResult<{ candidate: IdeaCandidate; links: FoundryWorkspace['evidenceLinks'] }>;
  stressTestCandidate(input: { candidateId: string }, actor?: Actor): ServiceResult<IdeaCandidate>;
  reviseCandidate(input: {
    candidateId: string;
    instruction: string;
    constraints?: string[];
    excludeEvidenceTypes?: EvidenceType[];
  }, actor?: Actor): ServiceResult<IdeaCandidate>;
  traceEvidence(input: { candidateId: string; componentPath: string }, actor?: Actor): ServiceResult<{ nodes: TraceNode[]; linkIds: string[] }>;
  finalizeBlueprint(input: { candidateId: string }, actor?: Actor): ServiceResult<Blueprint>;
  exportBlueprint(input: { format: 'markdown' | 'json'; includePrivate?: boolean }, actor?: Actor): ServiceResult<{ filename: string; mimeType: string; content: string }>;
  resetWorkspace(actor?: Actor): ServiceResult<FoundryWorkspace>;
}

export function nextActionsForWorkspace(workspace: FoundryWorkspace): string[] {
  switch (workspace.stage) {
    case 'EMPTY':
      return ['update_problem_brief', 'research_and_ideate'];
    case 'PROBLEM_DEFINED':
      return ['plan_research', 'research_and_ideate', 'ingest_evidence_batch'];
    case 'RESEARCH_PLANNED':
    case 'SOURCING':
      return ['ingest_evidence_batch', 'search_sources', 'extract_findings', 'get_evidence_gaps'];
    case 'EVIDENCE_REVIEW':
      return ['review_evidence_with_consent', 'get_evidence_gaps', 'synthesize_insights', 'compare_evidence_policy'];
    case 'INSIGHTS_READY':
      return ['generate_idea_candidates', 'get_evidence_gaps', 'compare_evidence_policy'];
    case 'CANDIDATES_READY':
      return ['inspect_candidate', 'compare_evidence_policy', 'apply_evidence_policy', 'stress_test_candidate'];
    case 'STRESS_TESTING':
    case 'BLUEPRINT_READY':
      return ['trace_evidence', 'compare_evidence_policy', 'finalize_blueprint_with_consent'];
    case 'FINALIZED':
      return ['trace_evidence', 'compare_evidence_policy', 'export_blueprint_with_consent'];
  }
}

function safeTitle(problem: string) {
  const compact = problem.trim().replace(/\s+/g, ' ');
  if (!compact) return 'Untitled problem';
  return compact.length > 48 ? `${compact.slice(0, 45)}…` : compact;
}

function isCuratedDemoProblem(workspace: FoundryWorkspace) {
  const problem = workspace.problemBrief.problemStatement.toLowerCase();
  return problem.includes('new administrators')
    && (problem.includes('first value') || problem.includes('mid-market b2b saas'));
}

function createResearchQuestions(brief: ProblemBrief, focus?: string): FoundryWorkspace['researchQuestions'] {
  const problem = brief.problemStatement.trim();
  const audience = brief.targetAudience.trim() || 'the people affected by this problem';
  const outcome = brief.desiredOutcome.trim() || focus?.trim() || 'a measurable improvement';
  const querySeed = problem.replace(/[^a-zA-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
  const timeframe = brief.timeframe.trim() || 'Most recent relevant period';

  return RESEARCH_QUESTION_TEMPLATES.map((template) => {
    const tailored = {
      first_party: {
        question: `What first-party behavior shows that “${problem}” is happening?`,
        purpose: 'Measure the problem before proposing a solution.',
        query: `${querySeed} behavioral data baseline`,
      },
      customer: {
        question: `How does ${audience} describe the problem, its causes, and current workarounds?`,
        purpose: 'Capture direct needs, language, and coping behavior.',
        query: `${querySeed} user interviews workarounds`,
      },
      academic: {
        question: `Which credible mechanisms could explain this problem or support ${outcome}?`,
        purpose: 'Find transferable causal or behavioral mechanisms.',
        query: `${querySeed} research mechanism intervention`,
      },
      market: {
        question: 'Which existing products, services, or standards address the same underlying need?',
        purpose: 'Map alternatives and reusable constraints.',
        query: `${querySeed} existing solutions standards`,
      },
      community: {
        question: `What weak but recent signals are people sharing about this problem?`,
        purpose: 'Collect emerging language without treating anecdotes as prevalence.',
        query: `${querySeed} experiences discussion`,
      },
      counter: {
        question: `What evidence contradicts the current framing or warns against the obvious solution?`,
        purpose: 'Attack the problem framing before committing to an intervention.',
        query: `${querySeed} counter evidence failure unintended consequences`,
      },
      alternatives: {
        question: 'What alternatives already compete for this job?',
        purpose: 'Understand substitution and differentiation.',
        query: `${querySeed} alternatives`,
      },
    }[template.lane];

    return {
      ...clone(template),
      question: tailored.question,
      purpose: tailored.purpose,
      timeframe,
      query: tailored.query,
      status: 'planned' as const,
    };
  });
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function sourceDomain(source: Source) {
  if (!source.url.startsWith('http')) return source.sourceFamilyId;
  try {
    const hostname = new URL(source.url).hostname.replace(/^www\./, '');
    return hostname === 'doi.org' && source.publisher !== 'User-provided source'
      ? source.publisher.toLowerCase()
      : hostname;
  } catch {
    return source.sourceFamilyId;
  }
}

function sourceForFinding(workspace: FoundryWorkspace, finding: Finding) {
  return workspace.sources.find((source) => source.id === finding.sourceId);
}

function accepted(finding: Finding) {
  return finding.reviewStatus === 'accepted' || finding.reviewStatus === 'qualified';
}

export const DEFAULT_EVIDENCE_POLICY: EvidencePolicy = {
  minimumCorroboration: 1,
  includePrivate: true,
};

function normalizeEvidencePolicy(policy: Partial<EvidencePolicy> = {}): EvidencePolicy {
  return {
    ...(policy.allowedSourceTypes?.length ? { allowedSourceTypes: [...new Set(policy.allowedSourceTypes)] } : {}),
    ...(policy.earliestPublishedAt?.trim() ? { earliestPublishedAt: policy.earliestPublishedAt.trim() } : {}),
    ...(policy.geography?.trim() ? { geography: policy.geography.trim() } : {}),
    minimumCorroboration: policy.minimumCorroboration ?? DEFAULT_EVIDENCE_POLICY.minimumCorroboration,
    includePrivate: policy.includePrivate ?? DEFAULT_EVIDENCE_POLICY.includePrivate,
  };
}

function findingEligible(workspace: FoundryWorkspace, finding: Finding, policy = normalizeEvidencePolicy(workspace.activeEvidencePolicy)): boolean {
  if (!accepted(finding)) return false;
  const source = sourceForFinding(workspace, finding);
  if (!source) return false;
  if (!policy.includePrivate && source.private) return false;
  if (policy.allowedSourceTypes?.length && !policy.allowedSourceTypes.includes(source.sourceType)) return false;
  if (policy.earliestPublishedAt && source.publishedAt && source.publishedAt < policy.earliestPublishedAt) return false;
  if (policy.geography) {
    const geography = finding.geography.trim().toLowerCase();
    const required = policy.geography.toLowerCase();
    if (!geography.includes(required)) return false;
  }
  return true;
}

function eligibleFindings(workspace: FoundryWorkspace, policy = normalizeEvidencePolicy(workspace.activeEvidencePolicy)) {
  return workspace.findings.filter((finding) => findingEligible(workspace, finding, policy));
}

function evidenceCategories(workspace: FoundryWorkspace) {
  return new Set(eligibleFindings(workspace).map((finding) => finding.evidenceType));
}

function calculateCandidate(workspace: FoundryWorkspace, candidate: IdeaCandidate): IdeaCandidate {
  const policy = normalizeEvidencePolicy(workspace.activeEvidencePolicy);
  const componentPaths = ['mechanism', ...candidate.features.map((_, index) => `features.${index}`)];
  const unsupportedComponents = componentPaths.filter((path) => {
    const links = workspace.evidenceLinks.filter((link) => (
      link.candidateId === candidate.id
      && link.componentPath === path
      && link.relationshipType !== 'contradicts'
    ));
    const supportingFamilies = new Set(links.flatMap((link) => {
      const finding = workspace.findings.find((item) => item.id === link.findingId);
      if (!finding || !findingEligible(workspace, finding, policy)) return [];
      const source = sourceForFinding(workspace, finding);
      return source ? [source.sourceFamilyId] : [];
    }));
    return supportingFamilies.size < policy.minimumCorroboration;
  });
  const coverage = Math.round(((componentPaths.length - unsupportedComponents.length) / componentPaths.length) * 100);
  return {
    ...candidate,
    coverage,
    unsupportedComponents,
    score: Math.round((coverage * 0.8) + candidate.noveltyBonus),
  };
}

function recalculateCandidates(workspace: FoundryWorkspace) {
  workspace.candidates = workspace.candidates.map((candidate) => calculateCandidate(workspace, candidate));
  const strongest = [...workspace.candidates].sort((a, b) => b.score - a.score)[0];
  if (strongest) {
    workspace.selectedCandidateId = strongest.id;
    workspace.candidates = workspace.candidates.map((candidate) => ({
      ...candidate,
      status: candidate.id === strongest.id && candidate.status === 'candidate' ? 'selected' : candidate.status,
    }));
  }
}

function evidenceGapSnapshot(workspace: FoundryWorkspace) {
  const reviewed = eligibleFindings(workspace);
  const domains = new Set(reviewed.map((finding) => sourceForFinding(workspace, finding)).filter(Boolean).map((source) => sourceDomain(source!)));
  const categories = evidenceCategories(workspace);
  const curatedDemo = isCuratedDemoProblem(workspace);
  const requiredFindings = curatedDemo ? 6 : 4;
  const requiredDomains = curatedDemo ? 3 : 2;
  const gaps: string[] = [];
  const warnings: string[] = [];
  const nextActions: EvidenceGapAction[] = [];

  if (reviewed.length < requiredFindings) {
    const reason = `${requiredFindings - reviewed.length} more accepted findings needed for the default gate.`;
    gaps.push(reason);
    nextActions.push({ lane: 'customer', evidenceType: 'primary_user_evidence', reason, suggestedTool: 'ingest_evidence_batch' });
  }
  if (domains.size < requiredDomains) {
    const reason = `${requiredDomains - domains.size} more independent source domains needed.`;
    gaps.push(reason);
    nextActions.push({ lane: 'academic', evidenceType: 'primary_research', reason, suggestedTool: 'search_sources' });
  }
  if (categories.size < 2) {
    const reason = `${2 - categories.size} more evidence categories needed.`;
    gaps.push(reason);
    nextActions.push({ lane: 'market', evidenceType: 'market_signal', reason, suggestedTool: 'ingest_evidence_batch' });
  }
  if (curatedDemo && !reviewed.some((finding) => typeof finding.value === 'number')) {
    const reason = 'At least one quantitative finding is required.';
    gaps.push(reason);
    nextActions.push({ lane: 'first_party', evidenceType: 'first_party_behavioral', reason, suggestedTool: 'ingest_evidence_batch' });
  }
  if (curatedDemo && !reviewed.some((finding) => typeof finding.value !== 'number')) {
    const reason = 'At least one qualitative finding is required.';
    gaps.push(reason);
    nextActions.push({ lane: 'customer', evidenceType: 'primary_user_evidence', reason, suggestedTool: 'ingest_evidence_batch' });
  }
  if (!reviewed.some((finding) => finding.evidenceType === 'counter_evidence')) {
    const reason = 'A counter-evidence finding is required before finalization.';
    gaps.push(reason);
    nextActions.push({ lane: 'counter', evidenceType: 'counter_evidence', reason, suggestedTool: 'search_sources' });
  }
  if (reviewed.some((finding) => finding.evidenceType === 'community_anecdote')) warnings.push('Community anecdotes are accepted but remain weak, non-prevalence evidence.');
  if (reviewed.some((finding) => finding.synthetic)) warnings.push('Synthetic first-party evidence is clearly labeled and must be replaced for a real decision.');

  return { gaps, warnings, nextActions };
}

function candidateRanking(workspace: FoundryWorkspace) {
  return [...workspace.candidates]
    .sort((a, b) => b.score - a.score)
    .map((candidate) => ({ candidateId: candidate.id, score: candidate.score, coverage: candidate.coverage }));
}

function comparePolicyInWorkspace(workspace: FoundryWorkspace, proposed: EvidencePolicy): EvidencePolicyComparison {
  const baselinePolicy = normalizeEvidencePolicy(workspace.activeEvidencePolicy);
  const baseline = clone(workspace);
  recalculateCandidates(baseline);
  const counterfactual = clone(workspace);
  counterfactual.activeEvidencePolicy = proposed;
  recalculateCandidates(counterfactual);
  const eligible = eligibleFindings(workspace, proposed);
  const eligibleIds = new Set(eligible.map((finding) => finding.id));
  const baselineRanking = candidateRanking(baseline);
  const proposedRanking = candidateRanking(counterfactual);
  return {
    baselinePolicy,
    proposedPolicy: proposed,
    eligibleFindingIds: eligible.map((finding) => finding.id),
    excludedFindingIds: workspace.findings.filter(accepted).map((finding) => finding.id).filter((id) => !eligibleIds.has(id)),
    baselineRanking,
    proposedRanking,
    recommendationChanged: baselineRanking[0]?.candidateId !== proposedRanking[0]?.candidateId,
  };
}

function summarizeFindings(findings: Finding[]) {
  return findings.slice(0, 2).map((finding) => finding.normalizedClaim).join(' ');
}

function createCustomInsights(workspace: FoundryWorkspace): FoundryWorkspace['insights'] {
  const reviewed = eligibleFindings(workspace);
  const counter = reviewed.filter((finding) => finding.evidenceType === 'counter_evidence');
  const groups = [
    {
      id: 'insight-observed',
      title: 'Direct evidence defines the problem',
      findingTypes: ['first_party_behavioral', 'primary_user_evidence'],
      fallback: 'Direct observations establish what is happening before a solution is proposed.',
    },
    {
      id: 'insight-mechanism',
      title: 'Mechanisms worth translating',
      findingTypes: ['primary_research', 'secondary_research', 'expert_opinion'],
      fallback: 'Research and expert evidence suggest mechanisms that may transfer into an intervention.',
    },
    {
      id: 'insight-market',
      title: 'Signals outside the immediate sample',
      findingTypes: ['market_signal', 'competitor_evidence', 'community_anecdote'],
      fallback: 'Market and community signals reveal alternatives and emerging expectations without proving prevalence.',
    },
    {
      id: 'insight-hypothesis',
      title: 'Assumptions remain visible',
      findingTypes: ['derived_calculation', 'hypothesis'],
      fallback: 'Unproven claims remain explicit hypotheses to test rather than hidden facts.',
    },
  ];

  const insights: FoundryWorkspace['insights'] = groups.flatMap((group) => {
    const findings = reviewed.filter((finding) => group.findingTypes.includes(finding.evidenceType));
    if (!findings.length) return [];
    return [{
      id: group.id,
      title: group.title,
      summary: summarizeFindings(findings) || group.fallback,
      findingIds: findings.map((finding) => finding.id),
      contradictionIds: [],
    }];
  });

  if (counter.length) {
    insights.push({
      id: 'insight-contradiction',
      title: 'Contradictions shape the test',
      summary: summarizeFindings(counter),
      findingIds: [],
      contradictionIds: counter.map((finding) => finding.id),
    });
  }

  const linked = new Set(insights.flatMap((insight) => insight.findingIds));
  const ungrouped = reviewed.filter((finding) => finding.evidenceType !== 'counter_evidence' && !linked.has(finding.id));
  if (ungrouped.length) {
    insights.push({
      id: 'insight-other',
      title: 'Additional evidence changes the frame',
      summary: summarizeFindings(ungrouped),
      findingIds: ungrouped.map((finding) => finding.id),
      contradictionIds: [],
    });
  }

  return insights;
}

function createCustomCandidateFixtures(
  workspace: FoundryWorkspace,
  count: 1 | 2 | 3,
  proposals: IdeaCandidateProposal[] = [],
): { candidates: IdeaCandidate[]; links: FoundryWorkspace['evidenceLinks'] } {
  const brief = workspace.problemBrief;
  const target = brief.targetAudience || 'People most affected by the problem';
  const outcome = brief.desiredOutcome || 'Improve the target behavior measurably';
  const constraints = brief.constraints.length ? brief.constraints : ['Start with a reversible pilot', 'Measure before scaling'];
  const defaults: IdeaCandidateProposal[] = [
    {
      name: 'Friction-First Pilot',
      oneLiner: `A focused intervention that removes the most evidenced barrier to ${outcome.toLowerCase()}.`,
      mechanism: 'Use the strongest direct signal to target one high-friction moment, then measure the behavioral change.',
      workflow: ['Identify the evidenced friction', 'Deliver targeted support at that moment', 'Measure the before-and-after behavior'],
      features: [
        { name: 'Signal trigger', description: 'Detect the behavior or condition most closely tied to the problem.' },
        { name: 'Contextual intervention', description: 'Respond at the moment the evidence says help is needed.' },
        { name: 'Outcome ledger', description: 'Show whether the target behavior changes after the intervention.' },
      ],
      differentiation: 'Starts from the strongest observed failure point rather than a broad feature list.',
    },
    {
      name: 'Guided Proof Loop',
      oneLiner: `A progressive workflow that helps ${target.toLowerCase()} reach a visible result before asking for more effort.`,
      mechanism: 'Translate credible mechanisms into small guided steps while preserving user control and an explicit exit.',
      workflow: ['Preview the intended outcome', 'Complete one guided step', 'Inspect the result', 'Continue or exit'],
      features: [
        { name: 'Outcome preview', description: 'Make the intended result concrete before the user commits more effort.' },
        { name: 'Adaptive guidance', description: 'Reveal only the help needed for the current step.' },
        { name: 'User control', description: 'Let experienced users skip, revise, or leave the guided path.' },
      ],
      differentiation: 'Combines evidence-backed guidance with an explicit control and recovery path.',
    },
    {
      name: 'Assumption-Safe Trial',
      oneLiner: `A low-cost field test that turns the riskiest belief behind this problem into a measurable decision.`,
      mechanism: 'Separate observed facts from assumptions, then test the assumption most likely to invalidate the idea.',
      workflow: ['Rank assumptions', 'Prototype the smallest intervention', 'Run with the target audience', 'Keep, revise, or stop'],
      features: [
        { name: 'Assumption map', description: 'Rank what must be true by importance and current evidence.' },
        { name: 'Smallest test', description: 'Define a reversible experiment around the critical assumption.' },
        { name: 'Decision gate', description: 'Predefine the evidence that causes the team to proceed, revise, or stop.' },
      ],
      differentiation: 'Optimizes for learning quality before implementation scope.',
    },
  ];
  const selectedProposals = (proposals.length ? proposals : defaults).slice(0, count);
  const candidates: IdeaCandidate[] = selectedProposals.map((proposal, index) => ({
    id: `candidate-${String.fromCharCode(97 + index)}`,
    name: proposal.name.trim(),
    oneLiner: proposal.oneLiner.trim(),
    targetUser: proposal.targetUser?.trim() || target,
    problem: proposal.problem?.trim() || brief.problemStatement,
    mechanism: proposal.mechanism.trim(),
    workflow: proposal.workflow?.map((step) => step.trim()).filter(Boolean) || ['Run a focused pilot', 'Measure the target behavior', 'Revise from the result'],
    features: proposal.features.slice(0, 4).map((feature, featureIndex) => ({
      id: `candidate-${index + 1}-feature-${featureIndex + 1}`,
      name: feature.name.trim(),
      description: feature.description.trim(),
    })),
    expectedOutcome: proposal.expectedOutcome?.trim() || outcome,
    implementationConstraints: [...new Set([...(proposal.implementationConstraints ?? []), ...constraints])],
    differentiation: proposal.differentiation?.trim() || 'Keeps the intervention tied to accepted evidence and an explicit validation gate.',
    assumptions: (proposal.assumptions?.length ? proposal.assumptions : [{
      statement: `The proposed mechanism can materially change ${outcome.toLowerCase()}.`,
      importance: 'critical' as const,
      validationMethod: 'Run the smallest representative test with the target audience.',
    }]).map((assumption, assumptionIndex) => ({
      id: `candidate-${index + 1}-assumption-${assumptionIndex + 1}`,
      statement: assumption.statement.trim(),
      importance: assumption.importance ?? 'high',
      evidenceStatus: 'partial' as const,
      validationMethod: assumption.validationMethod?.trim() || 'Test with the target audience before scaling.',
    })),
    coverage: 0,
    score: 0,
    noveltyBonus: [12, 8, 5][index] ?? 4,
    unsupportedComponents: [],
    status: 'candidate' as const,
  }));

  const supportFindings = workspace.findings.filter((finding) => accepted(finding) && finding.evidenceType !== 'counter_evidence');
  const links = candidates.flatMap((candidate, candidateIndex) => {
    const paths = ['mechanism', ...candidate.features.map((_, index) => `features.${index}`)];
    return paths.map((componentPath, componentIndex) => {
      const finding = supportFindings[(candidateIndex + componentIndex) % supportFindings.length];
      const insight = workspace.insights.find((item) => item.findingIds.includes(finding.id)) ?? workspace.insights[0];
      return {
        id: `evidence-link-custom-${candidateIndex + 1}-${componentIndex + 1}`,
        candidateId: candidate.id,
        componentPath,
        insightId: insight.id,
        findingId: finding.id,
        relationshipType: 'supports' as const,
        explanation: `This component is grounded in accepted evidence: ${finding.normalizedClaim}`,
      };
    });
  });

  return { candidates, links };
}

function markdownForBlueprint(workspace: FoundryWorkspace, blueprint: Blueprint, includePrivate = false) {
  const candidate = workspace.candidates.find((item) => item.id === blueprint.candidateId)!;
  const proofFindings = blueprint.proofFindingIds
    .map((id) => workspace.findings.find((finding) => finding.id === id))
    .filter((finding): finding is Finding => Boolean(finding))
    .filter((finding) => includePrivate || !sourceForFinding(workspace, finding)?.private);
  const counterFindings = blueprint.counterEvidenceIds
    .map((id) => workspace.findings.find((finding) => finding.id === id))
    .filter((finding): finding is Finding => Boolean(finding))
    .filter((finding) => includePrivate || !sourceForFinding(workspace, finding)?.private);

  return [
    `# ${blueprint.name}`,
    '',
    blueprint.proposition,
    '',
    `**For:** ${blueprint.targetUser}`,
    '',
    '## The observed problem',
    '',
    blueprint.observedProblem,
    '',
    '## The mechanism',
    '',
    blueprint.mechanism,
    '',
    '## Why this can work',
    '',
    ...(proofFindings.length ? proofFindings.flatMap((finding) => [
      `### ${finding.normalizedClaim}`,
      `${finding.population} · ${finding.timeframe} · ${finding.geography}`,
      `Source: [${finding.citation.sourceTitle}](${finding.citation.urlOrDocumentId}) — ${finding.citation.pageOrSection}`,
      '',
    ]) : ['Private proof cards are omitted from this public export.', '']),
    '## Core design decisions',
    '',
    ...candidate.features.map((feature) => `- **${feature.name}:** ${feature.description}`),
    '',
    '## Counter-evidence',
    '',
    ...counterFindings.map((finding) => `- ${finding.normalizedClaim} (${finding.citation.sourceTitle})`),
    '',
    '## What must be true',
    '',
    ...blueprint.assumptions.map((assumption) => `- ${assumption.statement} — ${assumption.evidenceStatus}`),
    '',
    '## What to test next',
    '',
    `**Hypothesis:** ${blueprint.validationPlan.hypothesis}`,
    '',
    `**Participants:** ${blueprint.validationPlan.targetParticipant}`,
    '',
    `**Intervention:** ${blueprint.validationPlan.intervention}`,
    '',
    `**Success metric:** ${blueprint.validationPlan.successMetric}`,
    '',
    `**Failure threshold:** ${blueprint.validationPlan.failureThreshold}`,
    '',
    `**Duration:** ${blueprint.validationPlan.expectedDuration}`,
    '',
    `**Evidence that changes the recommendation:** ${blueprint.validationPlan.evidenceThatChangesRecommendation}`,
  ].join('\n');
}

export function createFoundryService(
  getWorkspace: () => FoundryWorkspace,
  setWorkspace: (workspace: FoundryWorkspace) => void,
): FoundryService {
  const commit = <T,>(
    toolName: string,
    inputSummary: string,
    outputSummary: string,
    actor: Actor,
    mutate: (workspace: FoundryWorkspace) => T,
    modifiedIds: (data: T) => string[] = () => [],
  ): ServiceResult<T> => {
    const workspace = clone(getWorkspace());
    const data = mutate(workspace);
    workspace.version += 1;
    workspace.updatedAt = now();
    workspace.activeTool = toolName;
    workspace.lastError = undefined;
    workspace.activity.push({
      id: `event-${workspace.version}`,
      actor,
      toolName,
      inputSummary,
      outputSummary,
      createdAt: workspace.updatedAt,
      workspaceVersion: workspace.version,
      status: 'success',
    });
    setWorkspace(workspace);
    return {
      ok: true,
      data: clone(data),
      message: outputSummary,
      modifiedIds: modifiedIds(data),
      workspaceVersion: workspace.version,
      nextActions: nextActionsForWorkspace(workspace),
    };
  };

  const read = <T,>(data: T, message: string): ServiceResult<T> => {
    const workspace = getWorkspace();
    return {
      ok: true,
      data: clone(data),
      message,
      modifiedIds: [],
      workspaceVersion: workspace.version,
      nextActions: nextActionsForWorkspace(workspace),
    };
  };

  const fail = (
    toolName: string,
    actor: Actor,
    code: string,
    message: string,
    details: Pick<NonNullable<ServiceFailure['error']>, 'required' | 'current'> = {},
  ): ServiceFailure => {
    const workspace = clone(getWorkspace());
    workspace.version += 1;
    workspace.updatedAt = now();
    workspace.activeTool = toolName;
    workspace.lastError = { code, message };
    workspace.activity.push({
      id: `event-${workspace.version}`,
      actor,
      toolName,
      inputSummary: 'Input rejected by state or validation gate.',
      outputSummary: message,
      createdAt: workspace.updatedAt,
      workspaceVersion: workspace.version,
      status: 'error',
    });
    setWorkspace(workspace);
    return {
      ok: false,
      workspaceVersion: workspace.version,
      nextActions: nextActionsForWorkspace(workspace),
      error: { code, message, ...details },
    };
  };

  const readFail = (
    code: string,
    message: string,
    details: Pick<NonNullable<ServiceFailure['error']>, 'required' | 'current'> = {},
  ): ServiceFailure => {
    const workspace = getWorkspace();
    return {
      ok: false,
      workspaceVersion: workspace.version,
      nextActions: nextActionsForWorkspace(workspace),
      error: { code, message, ...details },
    };
  };

  return {
    getFoundryState(actor = 'agent') {
      void actor;
      const workspace = getWorkspace();
      const gaps = evidenceGapSnapshot(workspace);
      const selected = workspace.candidates.find((candidate) => candidate.id === workspace.selectedCandidateId);
      return read({
        workspaceId: workspace.id,
        title: workspace.title,
        stage: workspace.stage,
        version: workspace.version,
        problemBrief: clone(workspace.problemBrief),
        counts: {
          researchQuestions: workspace.researchQuestions.length,
          sources: workspace.sources.length,
          findings: workspace.findings.length,
          acceptedFindings: workspace.findings.filter(accepted).length,
          insights: workspace.insights.length,
          candidates: workspace.candidates.length,
          contradictions: workspace.findings.filter((finding) => finding.evidenceType === 'counter_evidence' && accepted(finding)).length,
          unsupportedComponents: workspace.candidates.reduce((sum, candidate) => sum + candidate.unsupportedComponents.length, 0),
          privateSources: workspace.sources.filter((source) => source.private).length,
        },
        selectedCandidate: selected ? { id: selected.id, name: selected.name, coverage: selected.coverage, score: selected.score } : undefined,
        warnings: [...gaps.gaps, ...gaps.warnings],
      }, 'Returned current stage, counts, warnings, and selected candidate.');
    },

    updateProblemBrief(input, actor = 'human') {
      const problemStatement = input.problemStatement?.trim() ?? getWorkspace().problemBrief.problemStatement;
      if (!problemStatement) {
        return fail('update_problem_brief', actor, 'INVALID_PROBLEM_BRIEF', 'A non-empty problem statement is required.');
      }
      return commit('update_problem_brief', 'Updated structured problem fields.', 'Problem brief updated and the refinery is ready.', actor, (workspace) => {
        const problemChanged = Boolean(workspace.problemBrief.problemStatement.trim())
          && workspace.problemBrief.problemStatement.trim() !== problemStatement;
        if (problemChanged) {
          workspace.researchQuestions = [];
          workspace.sources = [];
          workspace.findings = [];
          workspace.insights = [];
          workspace.candidates = [];
          workspace.evidenceLinks = [];
          workspace.selectedCandidateId = undefined;
          workspace.blueprint = undefined;
        }
        workspace.problemBrief = {
          ...workspace.problemBrief,
          ...input,
          problemStatement,
          constraints: input.constraints ? [...new Set(input.constraints.map((item) => item.trim()).filter(Boolean))] : workspace.problemBrief.constraints,
          excludedApproaches: input.excludedApproaches ? [...new Set(input.excludedApproaches)] : workspace.problemBrief.excludedApproaches,
          decisionCriteria: input.decisionCriteria ? [...new Set(input.decisionCriteria)] : workspace.problemBrief.decisionCriteria,
        };
        workspace.problemBrief.openQuestions = [
          'Who experiences this problem most acutely, and in what situation?',
          'What observable behavior confirms the problem today?',
          'Which constraints determine whether an intervention is viable?',
        ];
        workspace.title = safeTitle(problemStatement);
        workspace.stage = 'PROBLEM_DEFINED';
        return workspace.problemBrief;
      }, () => ['problem-brief']);
    },

    planResearch(input = {}, actor = 'human') {
      const workspace = getWorkspace();
      if (workspace.stage === 'EMPTY') {
        return fail('plan_research', actor, 'PROBLEM_REQUIRED', 'Define the problem brief before planning research.');
      }
      return commit('plan_research', `Planned research${input.focus ? ` for ${input.focus}` : ''}.`, 'Six source-lane questions are ready.', actor, (next) => {
        const existing = new Set(next.researchQuestions.map((question) => question.id));
        for (const question of createResearchQuestions(next.problemBrief, input.focus)) {
          if (!existing.has(question.id)) next.researchQuestions.push(clone(question));
        }
        next.stage = 'RESEARCH_PLANNED';
        return next.researchQuestions;
      }, (questions) => questions.map((question) => question.id));
    },

    searchSources(input, actor = 'human') {
      const workspace = getWorkspace();
      if (workspace.researchQuestions.length === 0) {
        return fail('search_sources', actor, 'RESEARCH_PLAN_REQUIRED', 'Create a research plan before searching a source lane.');
      }
      const fixtures = isCuratedDemoProblem(workspace)
        ? DEMO_FIXTURES.filter((fixture) => fixture.source.lane === input.lane)
        : [];
      const outputSummary = fixtures.length
        ? `${fixtures.length} curated source records are available in the ${input.lane} lane.`
        : `No connected ${input.lane} records were available. The research question remains open for browser research and import_source.`;
      return commit('search_sources', `Searched the ${input.lane} lane${input.query ? ` for ${input.query}` : ''}.`, outputSummary, actor, (next) => {
        const existing = new Set(next.sources.map((source) => source.id));
        for (const fixture of fixtures) {
          if (!existing.has(fixture.source.id)) next.sources.push(clone(fixture.source));
        }
        const question = next.researchQuestions.find((item) => item.lane === input.lane);
        if (question) question.status = fixtures.length ? 'complete' : 'searching';
        next.stage = 'SOURCING';
        return fixtures.map((fixture) => next.sources.find((source) => source.id === fixture.source.id)!);
      }, (items) => items.map((source) => source.id));
    },

    ingestEvidenceBatch(input, actor = 'human') {
      if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 8) {
        return fail('ingest_evidence_batch', actor, 'INVALID_EVIDENCE_BATCH', 'Provide between 1 and 8 evidence items in one batch.');
      }
      const allowedOrigins = new Set(['public_web', 'user_provided', 'connected_private', 'first_party']);
      const allowedMethods = new Set(['browser_agent', 'authorized_connector', 'paste', 'upload', 'system_research']);
      for (const item of input.items) {
        if (item.private && (item.provenance.permissionScope !== 'user_authorized'
          || !['connected_private', 'first_party'].includes(item.provenance.origin))) {
          return fail('ingest_evidence_batch', actor, 'EVIDENCE_PERMISSION_REQUIRED', `Private evidence “${item.title}” requires an explicit user-authorized permission scope.`);
        }
        if (!allowedOrigins.has(item.provenance.origin) || !allowedMethods.has(item.provenance.retrievalMethod)) {
          return fail('ingest_evidence_batch', actor, 'INVALID_EVIDENCE_ORIGIN', `Evidence “${item.title}” has an unsupported provenance origin or retrieval method.`);
        }
        if (!item.title?.trim() || !item.excerpt?.trim()) {
          return fail('ingest_evidence_batch', actor, 'INVALID_EVIDENCE_ITEM', 'Every evidence item needs a title and an exact or disclosed synthesized passage.');
        }
        const retrievedAt = Date.parse(item.provenance.retrievedAt);
        if (!item.provenance.retrievedAt.includes('T') || Number.isNaN(retrievedAt)) {
          return fail('ingest_evidence_batch', actor, 'INVALID_RETRIEVAL_TIME', `Evidence “${item.title}” needs a valid ISO retrieval timestamp.`);
        }
        if (item.url) {
          try {
            const parsed = new URL(item.url);
            if (!['http:', 'https:', 'document:'].includes(parsed.protocol) || ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) throw new Error('unsafe');
          } catch {
            return fail('ingest_evidence_batch', actor, 'INVALID_SOURCE_URL', `Evidence “${item.title}” has an invalid or unsafe source URL.`);
          }
        }
      }

      return commit('ingest_evidence_batch', `Validated ${input.items.length} provenance-rich evidence items.`, 'Evidence batch added atomically with permission and retrieval metadata.', actor, (workspace) => {
        const createdIds: string[] = [];
        const existingIds: string[] = [];
        const batchSources: Source[] = [];
        for (const item of input.items) {
          const fingerprint = hashText(`${item.title}|${item.url ?? ''}|${item.excerpt}`);
          const existing = workspace.sources.find((source) => source.contentHash === fingerprint);
          if (existing) {
            existingIds.push(existing.id);
            if (!batchSources.some((source) => source.id === existing.id)) batchSources.push(existing);
            continue;
          }
          const id = `source-batch-${fingerprint}`;
          const source: Source = {
            id,
            lane: item.lane,
            sourceType: item.sourceType,
            title: item.title.trim(),
            author: item.author?.trim() || (item.provenance.origin === 'user_provided' ? 'User provided' : 'Not specified'),
            publisher: item.publisher?.trim() || 'Not specified',
            publishedAt: item.publishedAt?.trim() || item.provenance.retrievedAt.slice(0, 10),
            url: item.url?.trim() || `document://${id}.txt`,
            accessMode: item.private ? 'private' : item.provenance.origin === 'user_provided' ? 'user_provided' : 'public',
            userProvided: item.provenance.origin === 'user_provided',
            synthetic: item.synthetic ?? false,
            private: item.private ?? false,
            contentHash: fingerprint,
            sourceFamilyId: `family-${hashText(item.url ? sourceDomain({ url: item.url, sourceFamilyId: id, publisher: item.publisher ?? '' } as Source) : id)}`,
            retrievalStatus: 'available',
            extractionStatus: 'pending',
            providedExcerpt: item.excerpt.trim(),
            providedExcerptKind: item.excerptKind ?? 'verbatim',
            provenance: clone(item.provenance),
          };
          workspace.sources.push(source);
          batchSources.push(source);
          createdIds.push(id);
        }
        workspace.stage = 'SOURCING';
        return { createdIds, existingIds, sources: batchSources };
      }, (result) => result.createdIds);
    },

    importSource(input, actor = 'human') {
      if (!input.title.trim() || (!input.url?.trim() && !input.excerpt?.trim())) {
        return fail('import_source', actor, 'INVALID_SOURCE', 'A title and either an accessible URL or pasted excerpt are required.');
      }
      if (input.url) {
        try {
          const parsed = new URL(input.url);
          if (!['http:', 'https:', 'document:'].includes(parsed.protocol) || ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
            return fail('import_source', actor, 'UNSAFE_SOURCE_URL', 'Only public HTTP(S) URLs or local document identifiers are supported.');
          }
        } catch {
          return fail('import_source', actor, 'INVALID_SOURCE_URL', 'The source URL is not valid.');
        }
      }
      const fingerprint = hashText(`${input.title}|${input.url ?? ''}|${input.excerpt ?? ''}`);
      const existing = getWorkspace().sources.find((source) => source.contentHash === fingerprint);
      if (existing) {
        const workspace = getWorkspace();
        return {
          ok: true,
          data: clone(existing),
          message: 'The source already exists; no duplicate was created.',
          modifiedIds: [existing.id],
          workspaceVersion: workspace.version,
          nextActions: nextActionsForWorkspace(workspace),
        };
      }
      return commit('import_source', `Imported ${input.sourceType} source ${input.title}.`, 'Source crate added and ready for extraction.', actor, (workspace) => {
        const id = `source-import-${fingerprint}`;
        const isAIWebSynthesis = input.excerptKind === 'ai_web_synthesis';
        const source: Source = {
          id,
          lane: input.lane ?? 'customer',
          sourceType: input.sourceType,
          title: input.title.trim(),
          author: input.author?.trim() || 'User provided',
          publisher: input.publisher?.trim() || 'User-provided source',
          publishedAt: input.publishedAt?.trim() || now().slice(0, 10),
          url: input.url?.trim() || `document://${id}.txt`,
          accessMode: input.private ? 'private' : isAIWebSynthesis ? 'public' : 'user_provided',
          userProvided: !isAIWebSynthesis,
          synthetic: input.synthetic ?? false,
          private: input.private ?? false,
          contentHash: fingerprint,
          sourceFamilyId: `family-${fingerprint}`,
          retrievalStatus: 'available',
          extractionStatus: 'pending',
          providedExcerpt: input.excerpt?.trim(),
          providedExcerptKind: input.excerpt ? input.excerptKind ?? 'verbatim' : undefined,
        };
        workspace.sources.push(source);
        workspace.stage = 'SOURCING';
        return source;
      }, (source) => [source.id]);
    },

    extractFindings(input, actor = 'human') {
      const workspace = getWorkspace();
      const sourceIds = input.sourceIds?.length ? [...new Set(input.sourceIds)] : workspace.sources.map((source) => source.id);
      if (sourceIds.length === 0) {
        return fail('extract_findings', actor, 'SOURCES_REQUIRED', 'Add or discover at least one source before extraction.');
      }
      const missing = sourceIds.filter((sourceId) => !workspace.sources.some((source) => source.id === sourceId));
      if (missing.length) {
        return fail('extract_findings', actor, 'SOURCE_NOT_FOUND', `Unknown source IDs: ${missing.join(', ')}.`);
      }
      const hasExactPassage = sourceIds.some((sourceId) => (
        DEMO_FIXTURES.some((fixture) => fixture.source.id === sourceId)
        || Boolean(workspace.sources.find((source) => source.id === sourceId)?.providedExcerpt?.trim())
      ));
      if (!hasExactPassage) {
        return fail('extract_findings', actor, 'NO_EXACT_PASSAGE', 'No exact supporting passage is available. Add a pasted excerpt or upload readable text before extraction.');
      }
      return commit('extract_findings', `Extracted atomic findings from ${sourceIds.length} sources.`, 'Citation-complete findings moved into the inspection bay.', actor, (next) => {
        const existing = new Set(next.findings.map((finding) => finding.id));
        for (const sourceId of sourceIds) {
          const fixture = DEMO_FIXTURES.find((item) => item.source.id === sourceId);
          if (fixture) {
            for (const finding of fixture.findings) {
              if (!existing.has(finding.id)) next.findings.push(clone(finding));
            }
          } else {
            const source = next.sources.find((item) => item.id === sourceId)!;
            const excerpt = source.providedExcerpt?.trim();
            if (excerpt) {
              const isAIWebSynthesis = source.providedExcerptKind === 'ai_web_synthesis';
              const findingId = `finding-${hashText(`${sourceId}|${excerpt}`)}`;
              if (!existing.has(findingId)) {
                const percentage = excerpt.match(/\b(\d+(?:\.\d+)?)\s*(?:%|percent\b)/i);
                const evidenceType: EvidenceType = source.lane === 'counter'
                  ? 'counter_evidence'
                  : source.sourceType === 'analytics'
                    ? 'first_party_behavioral'
                    : source.sourceType === 'customer' || source.sourceType === 'internal'
                      ? 'primary_user_evidence'
                      : source.sourceType === 'paper'
                        ? 'primary_research'
                        : source.sourceType === 'report'
                          ? 'secondary_research'
                          : source.sourceType === 'community'
                            ? 'community_anecdote'
                            : source.sourceType === 'competitor'
                              ? 'competitor_evidence'
                              : 'hypothesis';
                next.findings.push({
                  id: findingId,
                  sourceId,
                  normalizedClaim: excerpt.length > 180 ? `${excerpt.slice(0, 177)}…` : excerpt,
                  evidenceType,
                  value: percentage ? Number(percentage[1]) : undefined,
                  unit: percentage ? 'percent' : undefined,
                  population: 'Not supplied',
                  geography: 'Not supplied',
                  timeframe: source.publishedAt,
                  direct: !isAIWebSynthesis,
                  caveats: [isAIWebSynthesis
                    ? 'AI web-search synthesis linked to the cited source; open the original source to verify the wording and context.'
                    : 'User-provided excerpt requires human review before acceptance.'],
                  reviewStatus: 'pending',
                  extractionConfidence: 'moderate',
                  quality: {
                    directness: 'moderate', relevance: 'unknown', recency: 'unknown', methodTransparency: 'unknown',
                    independence: 'unknown', specificity: 'moderate', contextCompleteness: 'weak',
                  },
                  citation: {
                    sourceId,
                    sourceTitle: source.title,
                    authorOrPublisher: source.author || source.publisher,
                    publishedDate: source.publishedAt,
                    urlOrDocumentId: source.url,
                    pageOrSection: isAIWebSynthesis ? 'AI web-search synthesis' : 'User-provided excerpt',
                    exactExcerpt: excerpt.slice(0, 260),
                    retrievedAt: now(),
                    accessMode: source.accessMode,
                    evidenceOrigin: isAIWebSynthesis ? 'ai_web_synthesis' : 'verbatim_excerpt',
                  },
                  synthetic: source.synthetic,
                });
              }
            } else {
              source.retrievalStatus = 'metadata_only';
              source.extractionStatus = 'failed';
            }
          }
          const source = next.sources.find((item) => item.id === sourceId)!;
          if (source.extractionStatus !== 'failed') source.extractionStatus = 'complete';
        }
        next.stage = 'EVIDENCE_REVIEW';
        return next.findings.filter((finding) => sourceIds.includes(finding.sourceId));
      }, (findings) => findings.map((finding) => finding.id));
    },

    reviewFindings(input, actor = 'human') {
      const workspace = getWorkspace();
      const targeted = workspace.findings.filter((finding) => (
        input.findingIds?.includes(finding.id)
        || (input.evidenceType ? finding.evidenceType === input.evidenceType : !input.findingIds)
      ));
      if (targeted.length === 0) {
        return fail('review_findings', actor, 'FINDINGS_NOT_FOUND', 'No findings matched the requested review target.');
      }
      const reviewStatus = input.decision === 'accept' ? 'accepted' : input.decision === 'reject' ? 'rejected' : 'qualified';
      return commit('review_findings', `${input.decision} ${targeted.length} findings.`, `${targeted.length} findings moved to the ${reviewStatus} lane.`, actor, (next) => {
        const targetIds = new Set(targeted.map((finding) => finding.id));
        next.findings = next.findings.map((finding) => targetIds.has(finding.id) ? {
          ...finding,
          reviewStatus,
          reviewNote: input.note,
        } : finding);
        recalculateCandidates(next);
        return next.findings.filter((finding) => targetIds.has(finding.id));
      }, (findings) => findings.map((finding) => finding.id));
    },

    getEvidenceGaps(actor = 'agent') {
      void actor;
      return read(evidenceGapSnapshot(getWorkspace()), 'Returned missing, weak, and contradictory evidence areas.');
    },

    compareEvidencePolicy(input, actor = 'agent') {
      void actor;
      const policy = normalizeEvidencePolicy(input.policy);
      if (!Number.isInteger(policy.minimumCorroboration) || policy.minimumCorroboration < 1 || policy.minimumCorroboration > 8) {
        return readFail('INVALID_EVIDENCE_POLICY', 'Minimum corroboration must be an integer from 1 to 8.');
      }
      if (policy.earliestPublishedAt && Number.isNaN(Date.parse(policy.earliestPublishedAt))) {
        return readFail('INVALID_EVIDENCE_POLICY', 'The earliest publication date must be a valid date.');
      }
      return read(comparePolicyInWorkspace(getWorkspace(), policy), 'Compared the current recommendation with the proposed evidence policy without changing the workspace.');
    },

    applyEvidencePolicy(input, actor = 'human') {
      const policy = normalizeEvidencePolicy(input.policy);
      if (!Number.isInteger(policy.minimumCorroboration) || policy.minimumCorroboration < 1 || policy.minimumCorroboration > 8) {
        return fail('apply_evidence_policy', actor, 'INVALID_EVIDENCE_POLICY', 'Minimum corroboration must be an integer from 1 to 8.');
      }
      if (policy.earliestPublishedAt && Number.isNaN(Date.parse(policy.earliestPublishedAt))) {
        return fail('apply_evidence_policy', actor, 'INVALID_EVIDENCE_POLICY', 'The earliest publication date must be a valid date.');
      }
      const comparison = comparePolicyInWorkspace(getWorkspace(), policy);
      return commit('apply_evidence_policy', 'Applied a non-destructive evidence eligibility policy.', comparison.recommendationChanged
        ? 'Evidence policy applied and the leading recommendation changed.'
        : 'Evidence policy applied; the leading recommendation remained stable.', actor, (workspace) => {
        workspace.activeEvidencePolicy = policy;
        recalculateCandidates(workspace);
        return comparison;
      }, () => ['evidence-policy', ...comparison.proposedRanking.map((candidate) => candidate.candidateId)]);
    },

    synthesizeInsights(input = {}, actor = 'human') {
      void input;
      const workspace = getWorkspace();
      const reviewed = eligibleFindings(workspace);
      if (reviewed.length < 4) {
        return fail('synthesize_insights', actor, 'INSUFFICIENT_EVIDENCE', 'At least 4 accepted findings are required before synthesis.', { required: { acceptedFindings: 4 }, current: { acceptedFindings: reviewed.length } });
      }
      return commit('synthesize_insights', 'Clustered accepted findings by underlying pattern.', 'Four inspectable insight modules assembled.', actor, (next) => {
        if (!isCuratedDemoProblem(next)) {
          next.insights = createCustomInsights(next);
          next.stage = 'INSIGHTS_READY';
          return next.insights;
        }
        const allowed = new Set(next.findings.filter(accepted).map((finding) => finding.id));
        const cluster = (id: string, title: string, summary: string, findingIds: string[], contradictionIds: string[] = []) => ({
          id, title, summary,
          findingIds: findingIds.filter((findingId) => allowed.has(findingId)),
          contradictionIds: contradictionIds.filter((findingId) => allowed.has(findingId)),
        });
        next.insights = [
          cluster('insight-friction', 'Integration is the first-value bottleneck', 'Behavior and support evidence converge on the integration step, though neither proves a single cause.', ['finding-analytics', 'finding-support']),
          cluster('insight-guidance', 'Show the outcome before demanding configuration', 'Worked examples and contextual explanations may reduce avoidable cognitive work for new administrators.', ['finding-cognitive-load', 'finding-worked-examples', 'finding-contextual-help']),
          cluster('insight-confidence', 'Peer reassurance is attractive but weakly evidenced', 'Community observations suggest demand for trusted examples and live reassurance, but the evidence is anecdotal.', ['finding-community-peer', 'finding-community-office-hours']),
          cluster('insight-contradiction', 'Guidance must preserve user control', 'Mandatory tutorials can frustrate experienced users; the intervention should adapt or allow exit.', [], ['finding-tutorial-control']),
          cluster('insight-assumptions', 'Recommendations must expose what is still assumed', 'Service-design guidance supports keeping unsupported suggestions visible as hypotheses.', ['finding-assumption-discipline']),
        ];
        next.stage = 'INSIGHTS_READY';
        return next.insights;
      }, (insights) => insights.map((insight) => insight.id));
    },

    generateIdeaCandidates(input = {}, actor = 'human') {
      const workspace = getWorkspace();
      const reviewed = eligibleFindings(workspace);
      const categories = evidenceCategories(workspace);
      if (reviewed.length < 4 || categories.size < 2) {
        return fail('generate_idea_candidates', actor, 'INSUFFICIENT_EVIDENCE', 'At least 4 accepted findings across 2 evidence categories are required.', {
          required: { acceptedFindings: 4, evidenceCategories: 2 },
          current: { acceptedFindings: reviewed.length, evidenceCategories: categories.size },
        });
      }
      if (workspace.insights.length === 0) {
        return fail('generate_idea_candidates', actor, 'INSIGHTS_REQUIRED', 'Synthesize accepted evidence into insights before generating candidates.');
      }
      if (input.proposals?.some((proposal) => (
        !proposal.name?.trim()
        || !proposal.oneLiner?.trim()
        || !proposal.mechanism?.trim()
        || !proposal.features?.length
        || proposal.features.some((feature) => !feature.name?.trim() || !feature.description?.trim())
      ))) {
        return fail('generate_idea_candidates', actor, 'INVALID_CANDIDATE_PROPOSAL', 'Every proposed candidate needs a name, one-line proposition, mechanism, and at least one complete feature.');
      }
      const count = input.proposals?.length
        ? Math.min(3, input.proposals.length) as 1 | 2 | 3
        : input.count ?? 3;
      return commit('generate_idea_candidates', `Generated ${count} candidates from accepted insights.`, `${count} evidence-linked blueprints populated the idea forge.`, actor, (next) => {
        const fixtures = isCuratedDemoProblem(next) && !input.proposals?.length
          ? createCandidateFixtures()
          : createCustomCandidateFixtures(next, count, input.proposals);
        next.candidates = fixtures.candidates.slice(0, count);
        const candidateIds = new Set(next.candidates.map((candidate) => candidate.id));
        next.evidenceLinks = fixtures.links.filter((link) => candidateIds.has(link.candidateId));
        recalculateCandidates(next);
        next.stage = 'CANDIDATES_READY';
        return next.candidates;
      }, (candidates) => candidates.map((candidate) => candidate.id));
    },

    inspectCandidate(input, actor = 'agent') {
      void actor;
      const candidate = getWorkspace().candidates.find((item) => item.id === input.candidateId);
      if (!candidate) return readFail('CANDIDATE_NOT_FOUND', `Candidate ${input.candidateId} does not exist.`);
      const workspace = getWorkspace();
      return read({
        candidate,
        links: workspace.evidenceLinks.filter((link) => link.candidateId === input.candidateId),
      }, 'Returned candidate structure, evidence coverage, and unsupported components.');
    },

    stressTestCandidate(input, actor = 'human') {
      const candidate = getWorkspace().candidates.find((item) => item.id === input.candidateId);
      if (!candidate) return fail('stress_test_candidate', actor, 'CANDIDATE_NOT_FOUND', `Candidate ${input.candidateId} does not exist.`);
      const counterIds = eligibleFindings(getWorkspace()).filter((finding) => finding.evidenceType === 'counter_evidence').map((finding) => finding.id);
      if (counterIds.length === 0) return fail('stress_test_candidate', actor, 'COUNTER_EVIDENCE_REQUIRED', 'Search and accept at least one counter-evidence finding before stress testing.');
      return commit('stress_test_candidate', `Attacked ${candidate.name} with contradictions and adoption risks.`, 'Stress chamber recorded counter-evidence, assumptions, and feasibility risks.', actor, (workspace) => {
        const customProblem = !isCuratedDemoProblem(workspace);
        const counterFindings = workspace.findings.filter((finding) => counterIds.includes(finding.id));
        const evidenceCaveats = workspace.findings.filter(accepted).flatMap((finding) => finding.caveats).slice(0, 3);
        workspace.candidates = workspace.candidates.map((item) => item.id === input.candidateId ? {
          ...item,
          status: 'stress_tested',
          stressTest: {
            completedAt: now(),
            counterEvidenceIds: counterIds,
            adoptionRisks: customProblem
              ? counterFindings.map((finding) => finding.normalizedClaim).slice(0, 2)
              : ['Experienced administrators may reject guidance that feels mandatory.', 'A preview may be distrusted if it differs from production data.'],
            feasibilityRisks: customProblem
              ? (workspace.problemBrief.constraints.length ? workspace.problemBrief.constraints : ['The intervention must remain small enough to test before scaling.'])
              : ['Safe sample-data rendering must fit the existing architecture.', 'Credential validation must avoid exposing secrets.'],
            populationWarnings: customProblem
              ? (evidenceCaveats.length ? evidenceCaveats : ['Available evidence may not represent every affected user or context.'])
              : ['Learning research is mechanism evidence, not a direct SaaS activation study.'],
          },
        } : item);
        workspace.selectedCandidateId = input.candidateId;
        workspace.stage = 'STRESS_TESTING';
        return workspace.candidates.find((item) => item.id === input.candidateId)!;
      }, (item) => [item.id]);
    },

    reviseCandidate(input, actor = 'human') {
      const candidate = getWorkspace().candidates.find((item) => item.id === input.candidateId);
      if (!candidate) return fail('revise_candidate', actor, 'CANDIDATE_NOT_FOUND', `Candidate ${input.candidateId} does not exist.`);
      if (!input.instruction.trim()) return fail('revise_candidate', actor, 'REVISION_REQUIRED', 'A concrete revision instruction is required.');
      return commit('revise_candidate', `Revised ${candidate.name}: ${input.instruction}`, 'Candidate updated while preserving evidence lineage.', actor, (workspace) => {
        if (input.excludeEvidenceTypes?.length) {
          const excludedFindingIds = new Set(workspace.findings
            .filter((finding) => input.excludeEvidenceTypes!.includes(finding.evidenceType))
            .map((finding) => finding.id));
          workspace.evidenceLinks = workspace.evidenceLinks.filter((link) => (
            link.candidateId !== input.candidateId || !excludedFindingIds.has(link.findingId)
          ));
        }
        workspace.candidates = workspace.candidates.map((item) => item.id === input.candidateId ? {
          ...item,
          implementationConstraints: [...new Set([...item.implementationConstraints, ...(input.constraints ?? [])])],
          status: 'revised',
        } : item);
        recalculateCandidates(workspace);
        workspace.stage = 'CANDIDATES_READY';
        return workspace.candidates.find((item) => item.id === input.candidateId)!;
      }, (item) => [item.id]);
    },

    traceEvidence(input, actor = 'agent') {
      const workspace = getWorkspace();
      const candidate = workspace.candidates.find((item) => item.id === input.candidateId);
      if (!candidate) return fail('trace_evidence', actor, 'CANDIDATE_NOT_FOUND', `Candidate ${input.candidateId} does not exist.`);
      const link = workspace.evidenceLinks.find((item) => (
        item.candidateId === input.candidateId
        && item.componentPath === input.componentPath
        && findingEligible(workspace, workspace.findings.find((finding) => finding.id === item.findingId)!)
      ));
      if (!link) return fail('trace_evidence', actor, 'EVIDENCE_PATH_NOT_FOUND', `No accepted evidence path supports ${input.componentPath}.`);
      const finding = workspace.findings.find((item) => item.id === link.findingId)!;
      const insight = workspace.insights.find((item) => item.id === link.insightId)!;
      const source = workspace.sources.find((item) => item.id === finding.sourceId)!;
      const componentLabel = input.componentPath === 'mechanism'
        ? candidate.mechanism
        : candidate.features[Number(input.componentPath.split('.')[1])]?.name ?? input.componentPath;
      const nodes: TraceNode[] = [
        { id: `${candidate.id}:${input.componentPath}`, kind: 'idea_component', label: componentLabel, detail: link.explanation },
        { id: insight.id, kind: 'insight', label: insight.title, detail: insight.summary },
        { id: finding.id, kind: 'finding', label: finding.normalizedClaim, detail: finding.citation.exactExcerpt },
        { id: source.id, kind: 'source', label: source.title, detail: source.url },
      ];
      return commit('trace_evidence', `Traced ${candidate.name} ${input.componentPath}.`, 'Returned the complete feature-to-source proof path.', actor, () => ({ nodes, linkIds: [link.id] }));
    },

    finalizeBlueprint(input, actor = 'human') {
      const workspace = getWorkspace();
      const candidate = workspace.candidates.find((item) => item.id === input.candidateId);
      if (!candidate) return fail('finalize_blueprint', actor, 'CANDIDATE_NOT_FOUND', `Candidate ${input.candidateId} does not exist.`);
      if (!candidate.stressTest) return fail('finalize_blueprint', actor, 'STRESS_TEST_REQUIRED', 'Stress-test the selected candidate before finalization.');
      const gaps = evidenceGapSnapshot(workspace);
      if (gaps.gaps.length) return fail('finalize_blueprint', actor, 'QUALITY_GATE_FAILED', gaps.gaps.join(' '));
      if (candidate.unsupportedComponents.length) return fail('finalize_blueprint', actor, 'UNSUPPORTED_COMPONENTS', `Link evidence to: ${candidate.unsupportedComponents.join(', ')}.`);

      const validationPlan: ValidationPlan = isCuratedDemoProblem(workspace) ? {
        hypothesis: 'Showing an outcome preview before minimum configuration will increase first-session activation for new administrators without increasing support contacts.',
        targetParticipant: '24 newly assigned administrators from mid-market customer accounts, stratified by prior integration experience.',
        intervention: 'Clickable prototype of the First-Value Flightpath versus the current setup sequence.',
        successMetric: 'At least a 15 percentage-point increase in simulated first-session activation, with no increase in critical setup errors.',
        failureThreshold: 'Less than a 5 percentage-point activation difference, or more critical setup errors than the current flow.',
        expectedDuration: 'Two weeks, including prototype testing and one instrumented pilot cohort.',
        evidenceThatChangesRecommendation: 'No activation lift, expert users cannot exit cleanly, or sample-data previews materially reduce trust.',
      } : {
        hypothesis: `If ${candidate.mechanism.charAt(0).toLowerCase()}${candidate.mechanism.slice(1)}, then ${workspace.problemBrief.desiredOutcome || 'the target behavior will improve'} for ${workspace.problemBrief.targetAudience || 'the affected audience'}.`,
        targetParticipant: workspace.problemBrief.targetAudience || 'A small representative sample of the people most affected by the problem.',
        intervention: `A testable prototype of ${candidate.name} focused on its highest-evidence feature.`,
        successMetric: `A pre-registered, observable improvement in ${workspace.problemBrief.desiredOutcome || 'the target behavior'} compared with the current baseline.`,
        failureThreshold: 'No meaningful improvement, a material increase in errors or burden, or evidence that the mechanism does not fit the target audience.',
        expectedDuration: workspace.problemBrief.timeframe || 'Two weeks for a prototype test and one measured pilot.',
        evidenceThatChangesRecommendation: 'A failed target metric, stronger counter-evidence, or a critical assumption disproven by the pilot.',
      };

      return commit('finalize_blueprint', `Finalized ${candidate.name}.`, 'Proof-carrying idea blueprint locked with proof, caveats, assumptions, and the next test.', actor, (next) => {
        const links = next.evidenceLinks.filter((link) => link.candidateId === candidate.id);
        const proofFindingIds = [...new Set(links.map((link) => link.findingId))].filter((findingId) => {
          const finding = next.findings.find((item) => item.id === findingId);
          return finding && findingEligible(next, finding) && finding.evidenceType !== 'counter_evidence';
        }).slice(0, 5);
        const blueprint: Blueprint = {
          id: 'blueprint-1',
          version: (next.blueprint?.version ?? 0) + 1,
          candidateId: candidate.id,
          name: candidate.name,
          proposition: candidate.oneLiner,
          targetUser: candidate.targetUser,
          observedProblem: candidate.problem,
          mechanism: candidate.mechanism,
          proofFindingIds,
          coreDecisions: candidate.features.map((feature, index) => ({
            componentPath: `features.${index}`,
            decision: `${feature.name}: ${feature.description}`,
            evidenceLinkIds: links.filter((link) => link.componentPath === `features.${index}`).map((link) => link.id),
          })),
          counterEvidenceIds: candidate.stressTest!.counterEvidenceIds,
          assumptions: candidate.assumptions,
          validationPlan,
          status: 'finalized',
          finalizedAt: now(),
        };
        next.blueprint = blueprint;
        next.selectedCandidateId = candidate.id;
        next.stage = 'FINALIZED';
        return blueprint;
      }, (blueprint) => [blueprint.id]);
    },

    exportBlueprint(input, actor = 'human') {
      const workspace = getWorkspace();
      if (!workspace.blueprint) return fail('export_blueprint', actor, 'BLUEPRINT_REQUIRED', 'Finalize a blueprint before exporting it.');
      const exportSources = workspace.sources.filter((source) => input.includePrivate || !source.private);
      const exportFindings = workspace.findings.filter((finding) => input.includePrivate || !sourceForFinding(workspace, finding)?.private);
      const exportFindingIds = new Set(exportFindings.map((finding) => finding.id));
      const exportLinkIds = new Set(workspace.evidenceLinks
        .filter((link) => exportFindingIds.has(link.findingId))
        .map((link) => link.id));
      const exportBlueprint: Blueprint = input.includePrivate ? workspace.blueprint : {
        ...workspace.blueprint,
        proofFindingIds: workspace.blueprint.proofFindingIds.filter((id) => exportFindingIds.has(id)),
        counterEvidenceIds: workspace.blueprint.counterEvidenceIds.filter((id) => exportFindingIds.has(id)),
        coreDecisions: workspace.blueprint.coreDecisions.map((decision) => ({
          ...decision,
          evidenceLinkIds: decision.evidenceLinkIds.filter((id) => exportLinkIds.has(id)),
        })),
      };
      const content = input.format === 'json'
        ? JSON.stringify({ blueprint: exportBlueprint, sources: exportSources, findings: exportFindings }, null, 2)
        : markdownForBlueprint(workspace, workspace.blueprint, input.includePrivate);
      return commit('export_blueprint', `Exported ${input.format}${input.includePrivate ? ' with approved private evidence' : ' without private evidence'}.`, 'A shareable blueprint export is ready.', actor, () => ({
        filename: `proof-foundry-${workspace.blueprint!.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${input.format === 'json' ? 'json' : 'md'}`,
        mimeType: input.format === 'json' ? 'application/json' : 'text/markdown',
        content,
      }));
    },

    resetWorkspace(actor = 'human') {
      const fresh = createInitialWorkspace();
      fresh.activity.push({
        id: 'event-2', actor, toolName: 'reset_workspace', inputSummary: 'Cleared the active workspace.', outputSummary: 'The factory returned to its empty state.', createdAt: now(), workspaceVersion: 1, status: 'success',
      });
      setWorkspace(fresh);
      return {
        ok: true,
        data: clone(fresh),
        message: 'The factory returned to its empty state.',
        modifiedIds: [fresh.id],
        workspaceVersion: fresh.version,
        nextActions: nextActionsForWorkspace(fresh),
      };
    },
  };
}

export function createInMemoryFoundry(initial = createInitialWorkspace()) {
  let workspace = clone(initial);
  const service = createFoundryService(
    () => workspace,
    (next) => { workspace = next; },
  );
  return {
    service,
    getWorkspace: () => workspace,
  };
}
