import type { FoundryService } from '../domain/foundry-service';
import type { Actor, AgentConsentRequest, FoundryWorkspace, IdeaCandidateProposal, ServiceResult, SourceLane } from '../domain/types';

export type AutonomousResearchPhase =
  | 'idle'
  | 'planning'
  | 'searching'
  | 'extracting'
  | 'synthesizing'
  | 'ideating'
  | 'stress_testing'
  | 'complete'
  | 'error';

export interface AutonomousResearchProgress {
  phase: AutonomousResearchPhase;
  progress: number;
  message: string;
  error?: string;
  errorCode?: 'usage_limit';
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface RunAutonomousResearchOptions {
  problem: string;
  service: FoundryService;
  getWorkspace: () => FoundryWorkspace;
  fetcher?: FetchLike;
  signal?: AbortSignal;
  onProgress?: (progress: AutonomousResearchProgress) => void;
  pause?: () => Promise<void>;
  actor?: Actor;
  requestAgentConsent?: (request: AgentConsentRequest, signal?: AbortSignal) => Promise<boolean>;
}

export interface GroundedResearchReport {
  status: 'complete';
  questions: string[];
  normalized_problem: string;
  target_audience: string;
  desired_outcome: string;
  recommendation: {
    name: string;
    one_liner: string;
    mechanism: string;
    features: Array<{ name: string; description: string }>;
    assumptions: Array<{ statement: string; validation_method: string }>;
  };
  sources: Array<{
    title: string;
    url: string;
    publisher: string;
    published_at: string;
    source_type: 'paper' | 'report' | 'community' | 'competitor';
    lane: SourceLane;
    finding: string;
  }>;
}

interface ClarificationResponse {
  status: 'needs_clarification';
  questions: string[];
  normalized_problem: string;
}

interface ResearchErrorResponse {
  status?: undefined;
  error?: string;
  message?: string;
}

function requireResult<T>(result: ServiceResult<T>) {
  if (!result.ok) throw new Error(result.error.message);
  return result.data as T;
}

function proposalFromReport(report: GroundedResearchReport, workspace: FoundryWorkspace): IdeaCandidateProposal {
  return {
    name: report.recommendation.name,
    oneLiner: report.recommendation.one_liner,
    mechanism: report.recommendation.mechanism,
    features: report.recommendation.features,
    problem: workspace.problemBrief.problemStatement,
    targetUser: workspace.problemBrief.targetAudience,
    expectedOutcome: workspace.problemBrief.desiredOutcome,
    implementationConstraints: [
      'Start with a reversible pilot before scaling',
      'Verify each source excerpt against the original source before implementation',
    ],
    differentiation: `The recommendation was synthesized from ${report.sources.length} web-researched sources, with counter-evidence retained as a design constraint.`,
    assumptions: report.recommendation.assumptions.map((assumption) => ({
      statement: assumption.statement,
      importance: 'critical' as const,
      validationMethod: assumption.validation_method,
    })),
  };
}

export async function runAutonomousResearch({
  problem,
  service,
  getWorkspace,
  fetcher = fetch,
  signal,
  onProgress = () => {},
  pause = () => Promise.resolve(),
  actor = 'human',
  requestAgentConsent,
}: RunAutonomousResearchOptions) {
  const update = async (phase: AutonomousResearchPhase, progress: number, message: string) => {
    onProgress({ phase, progress, message });
    await pause();
  };
  const requireAgentConsent = async (request: Omit<AgentConsentRequest, 'workspaceVersion'>) => {
    if (actor !== 'agent') return;
    if (!requestAgentConsent) throw new Error('The in-page human consent checkpoint is unavailable for this agent run.');
    const expectedVersion = getWorkspace().version;
    const approved = await requestAgentConsent({ ...request, workspaceVersion: expectedVersion }, signal);
    if (!approved) throw new Error('The human did not approve the requested agent action; completed work remains unchanged.');
    if (signal?.aborted) throw signal.reason ?? new DOMException('The agent run was cancelled.', 'AbortError');
    if (getWorkspace().version !== expectedVersion) throw new Error('The workspace changed during consent. Read the current state and retry.');
  };
  await update('planning', 8, 'Giving the problem to the AI research agent and checking whether it is answerable.');
  const response = await fetcher('/api/research', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ problem }),
    signal,
  });
  const payload = await response.json() as GroundedResearchReport | ClarificationResponse | ResearchErrorResponse;
  if (!response.ok) {
    throw new Error('message' in payload && payload.message ? payload.message : 'AI web research is temporarily unavailable.');
  }
  if (payload.status === 'needs_clarification') {
    throw new Error(`LaunchPad needs more detail before researching this request: ${payload.questions.join(' ')}`);
  }
  if (payload.status !== 'complete') throw new Error('The AI research service returned an invalid report.');
  const report = payload;
  const supportingCount = report.sources.filter((source) => source.lane !== 'counter').length;
  const counterCount = report.sources.filter((source) => source.lane === 'counter').length;
  if (report.sources.length < 4 || supportingCount < 2 || counterCount < 1) {
    throw new Error('The AI research service did not return enough grounded evidence to build a report. Refine the statement and retry.');
  }

  requireResult(service.updateProblemBrief({
    problemStatement: report.normalized_problem,
    targetAudience: report.target_audience,
    desiredOutcome: report.desired_outcome,
    timeframe: 'A focused pilot within four to six weeks',
  }, actor));
  requireResult(service.planResearch({ focus: report.desired_outcome }, 'system'));

  await update('searching', 32, `Checking ${report.sources.length} AI-discovered web sources and their citations.`);
  for (const source of report.sources) {
    requireResult(service.importSource({
      title: source.title,
      sourceType: source.source_type,
      url: source.url,
      excerpt: source.finding,
      excerptKind: 'ai_web_synthesis',
      lane: source.lane,
      author: source.publisher,
      publisher: source.publisher,
      publishedAt: source.published_at,
    }, 'system'));
  }

  await update('extracting', 48, `Turning ${report.sources.length} cited web findings into traceable evidence records.`);
  const sourceIds = getWorkspace().sources.map((source) => source.id);
  const findings = requireResult<FoundryWorkspace['findings']>(service.extractFindings({ sourceIds }, 'system'));
  await requireAgentConsent({
    kind: 'review_evidence',
    title: 'Qualify browser-researched evidence?',
    summary: `The browser agent wants to qualify ${findings.length} exact findings before synthesis.`,
    affectedIds: findings.map((finding) => finding.id),
    privacyScope: findings.some((finding) => getWorkspace().sources.find((source) => source.id === finding.sourceId)?.private)
      ? 'includes_private'
      : 'public_only',
  });
  requireResult(service.reviewFindings({
    decision: 'qualify',
    findingIds: findings.map((finding) => finding.id),
    note: 'Automatically qualified from an AI web-search synthesis linked to its cited source. Verify the original source before implementation.',
  }, 'system'));

  await update('synthesizing', 68, 'Clustering mechanisms, repeated signals, and counter-evidence.');
  requireResult(service.synthesizeInsights({}, 'system'));

  await update('ideating', 82, 'Building one solution from the strongest converging evidence.');
  const proposal = proposalFromReport(report, getWorkspace());
  const candidates = requireResult<FoundryWorkspace['candidates']>(service.generateIdeaCandidates({ proposals: [proposal] }, 'system'));
  const selected = candidates[0];
  if (!selected) throw new Error('LaunchPad could not assemble a supported solution from the available findings.');

  await update('stress_testing', 92, 'Testing the solution against limitations and transfer risks.');
  requireResult(service.stressTestCandidate({ candidateId: selected.id }, 'system'));
  await requireAgentConsent({
    kind: 'finalize_blueprint',
    title: 'Finalize this evidence-backed blueprint?',
    summary: 'Finalization locks the selected recommendation and validation plan into the visible workspace.',
    affectedIds: [selected.id],
    privacyScope: getWorkspace().sources.some((source) => source.private) ? 'includes_private' : 'public_only',
  });
  const blueprint = requireResult(service.finalizeBlueprint({ candidateId: selected.id }, 'system'));

  await update('complete', 100, 'Your evidence-backed solution is ready.');
  return blueprint;
}
