import type { FoundryService } from '../domain/foundry-service';
import type { Actor, FoundryWorkspace, IdeaCandidateProposal, ServiceResult, SourceLane } from '../domain/types';
import type { AcademicSearchResult } from '../search/crossref';
import { isEnglishText } from '../language/english-only';

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
}

type ResearchHit = { result: AcademicSearchResult; lane: SourceLane };

function inferProblemContext(problem: string) {
  const compact = problem.trim().replace(/\s+/g, ' ');
  const audienceCandidate = compact.split(/\b(?:struggle|struggles|lose|loses|lack|lacks|cannot|can't|need|needs|have|has|face|faces|find|finds|are|is)\b/i)[0]?.trim();
  const audience = audienceCandidate && audienceCandidate.split(' ').length <= 10
    ? audienceCandidate
    : 'People most affected by this problem';
  const lower = compact.toLowerCase();

  if (/safety|hazard|accident|compliance|risk/.test(lower)) {
    return {
      audience,
      desiredOutcome: 'Reduce preventable safety failures and improve readiness',
      proposal: {
        name: 'Readiness Passport',
        oneLiner: `A staged readiness system that helps ${audience.toLowerCase()} prove they can act safely before entering a higher-risk situation.`,
        mechanism: 'Translate the strongest research mechanisms into short contextual practice, then require observable readiness before progression.',
        features: [
          { name: 'Risk-matched pathway', description: 'Turn the problem into short preparation steps matched to the user and situation.' },
          { name: 'Practice checkpoint', description: 'Use scenario-based practice at the moment research suggests it will transfer best.' },
          { name: 'Readiness proof', description: 'Record an observable checkpoint before the user proceeds independently.' },
        ],
      },
    };
  }
  if (/training|onboarding|learning|guidance|skill|education/.test(lower)) {
    return {
      audience,
      desiredOutcome: 'Improve confident task completion and reduce early drop-off',
      proposal: {
        name: 'Guided Practice Loop',
        oneLiner: `A role-specific practice path that helps ${audience.toLowerCase()} reach a visible first success with consistent guidance.`,
        mechanism: 'Combine worked examples, contextual prompts, and immediate practice so the user learns by reaching a real outcome rather than consuming a generic tutorial.',
        features: [
          { name: 'Role map', description: 'Adapt the path to the user’s immediate job and current confidence.' },
          { name: 'Worked scenario', description: 'Show one concrete example before asking the user to perform the task.' },
          { name: 'Proof checkpoint', description: 'Confirm the user can complete the task and surface where support is still needed.' },
        ],
      },
    };
  }
  if (/schedule|coordination|handoff|workflow|operation|staffing/.test(lower)) {
    return {
      audience,
      desiredOutcome: 'Reduce coordination failures and make the next action unambiguous',
      proposal: {
        name: 'Coordination Signal Board',
        oneLiner: `A shared exception-first workflow that helps ${audience.toLowerCase()} see what needs attention before work falls through a handoff.`,
        mechanism: 'Convert fragmented status updates into one visible queue, then prioritize only the exceptions most likely to block the desired outcome.',
        features: [
          { name: 'Single operating queue', description: 'Combine the work states that currently live across disconnected channels.' },
          { name: 'Exception signal', description: 'Bring blocked, late, or ambiguous handoffs to the top.' },
          { name: 'Closed-loop ownership', description: 'Make the next owner and completion evidence explicit.' },
        ],
      },
    };
  }
  if (/retain|retention|drop.?off|engagement|churn|turnover/.test(lower)) {
    return {
      audience,
      desiredOutcome: 'Reduce avoidable drop-off at the earliest high-friction moment',
      proposal: {
        name: 'Early Support Loop',
        oneLiner: `A timely intervention that identifies when ${audience.toLowerCase()} are likely to disengage and delivers the smallest useful support.`,
        mechanism: 'Use early observable friction as a trigger for contextual support, then measure whether the intervention changes continuation behavior.',
        features: [
          { name: 'Friction signal', description: 'Detect the earliest behavior associated with disengagement.' },
          { name: 'Contextual support', description: 'Respond with one relevant action rather than a broad message.' },
          { name: 'Continuation measure', description: 'Compare behavior before and after the intervention.' },
        ],
      },
    };
  }

  return {
    audience,
    desiredOutcome: 'Produce a measurable improvement in the problem’s most important behavior',
    proposal: {
      name: 'Evidence-Guided Pilot',
      oneLiner: `A focused intervention for ${audience.toLowerCase()} that targets the strongest research-backed mechanism behind the problem.`,
      mechanism: 'Translate converging research findings into one reversible intervention, preserve counter-evidence as constraints, and measure the affected behavior before scaling.',
      features: [
        { name: 'Evidence trigger', description: 'Focus the intervention on the strongest repeated signal in the research.' },
        { name: 'Contextual action', description: 'Deliver one concrete action at the moment it is most likely to matter.' },
        { name: 'Decision measure', description: 'Predefine the result that means continue, revise, or stop.' },
      ],
    },
  };
}

export function buildResearchQueries(problem: string) {
  const seed = problem.trim().replace(/\s+/g, ' ').slice(0, 140);
  return [
    { lane: 'academic' as const, query: seed },
    { lane: 'academic' as const, query: `${seed} intervention effectiveness` },
    { lane: 'counter' as const, query: `${seed} limitations barriers adverse effects` },
  ];
}

function chooseResearchHits(hits: ResearchHit[]) {
  const seenDois = new Set<string>();
  const selected: ResearchHit[] = [];
  const addLane = (lane: SourceLane, limit: number) => {
    const laneHits = hits.filter((hit) => hit.lane === lane
      && hit.result.excerpt
      && hit.result.excerpt.trim().length >= 40
      && isEnglishText(`${hit.result.title} ${hit.result.excerpt}`));
    const publishers = new Set<string>();
    for (const hit of laneHits) {
      if (selected.length >= 7 || selected.filter((item) => item.lane === lane).length >= limit || seenDois.has(hit.result.doi)) continue;
      if (publishers.has(hit.result.publisher) && laneHits.some((candidate) => !publishers.has(candidate.result.publisher) && !seenDois.has(candidate.result.doi))) continue;
      selected.push(hit);
      seenDois.add(hit.result.doi);
      publishers.add(hit.result.publisher);
    }
  };
  addLane('academic', 5);
  addLane('counter', 2);
  return selected;
}

function requireResult<T>(result: ServiceResult<T>) {
  if (!result.ok) throw new Error(result.error.message);
  return result.data as T;
}

function enrichProposal(base: IdeaCandidateProposal, workspace: FoundryWorkspace): IdeaCandidateProposal {
  const evidenceTitles = workspace.sources.filter((source) => source.lane === 'academic').slice(0, 3).map((source) => source.title);
  return {
    ...base,
    problem: workspace.problemBrief.problemStatement,
    targetUser: workspace.problemBrief.targetAudience,
    expectedOutcome: workspace.problemBrief.desiredOutcome,
    implementationConstraints: [
      'Start with a reversible pilot before scaling',
      'Verify the cited abstracts against the full papers before implementation',
    ],
    differentiation: `The intervention is derived from converging findings across ${evidenceTitles.length} research threads, with limitations retained as design constraints.`,
    assumptions: [
      {
        statement: 'The research mechanisms transfer to the specific population and setting described in the problem.',
        importance: 'critical',
        validationMethod: 'Test the smallest representative version with affected users and compare it with the current behavior.',
      },
    ],
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
}: RunAutonomousResearchOptions) {
  const update = async (phase: AutonomousResearchPhase, progress: number, message: string) => {
    onProgress({ phase, progress, message });
    await pause();
  };
  const context = inferProblemContext(problem);

  await update('planning', 8, 'Turning your problem into focused research questions.');
  requireResult(service.updateProblemBrief({
    problemStatement: problem,
    targetAudience: context.audience,
    desiredOutcome: context.desiredOutcome,
    timeframe: 'A focused pilot within four to six weeks',
  }, actor));
  requireResult(service.planResearch({ focus: context.desiredOutcome }, 'system'));

  await update('searching', 24, 'Searching peer-reviewed research and limitation-focused studies.');
  const batches = await Promise.allSettled(buildResearchQueries(problem).map(async ({ lane, query }) => {
    const response = await fetcher(`/api/search?q=${encodeURIComponent(query)}`, { signal });
    if (!response.ok) throw new Error('Academic search is temporarily unavailable.');
    const payload = await response.json() as { results?: AcademicSearchResult[] };
    return (payload.results ?? []).map((result) => ({ result, lane }));
  }));
  const hits = chooseResearchHits(batches.flatMap((batch) => batch.status === 'fulfilled' ? batch.value : []));
  const academicCount = hits.filter((hit) => hit.lane === 'academic').length;
  const counterCount = hits.filter((hit) => hit.lane === 'counter').length;
  if (hits.length < 4 || academicCount < 3 || counterCount < 1) {
    throw new Error('LaunchPad could not find enough citation-ready research for this problem. Refine the statement and retry.');
  }

  for (const { result, lane } of hits) {
    requireResult(service.importSource({
      title: result.title,
      sourceType: 'paper',
      url: result.url,
      excerpt: result.excerpt,
      lane,
      author: result.authors,
      publisher: result.publisher,
      publishedAt: result.published_at,
    }, 'system'));
  }

  await update('extracting', 48, `Reading ${hits.length} relevant abstracts and extracting traceable findings.`);
  const sourceIds = getWorkspace().sources.map((source) => source.id);
  const findings = requireResult<FoundryWorkspace['findings']>(service.extractFindings({ sourceIds }, 'system'));
  requireResult(service.reviewFindings({
    decision: 'qualify',
    findingIds: findings.map((finding) => finding.id),
    note: 'Automatically qualified from a citation-linked abstract. Verify the full paper before implementation.',
  }, 'system'));

  await update('synthesizing', 68, 'Clustering mechanisms, repeated signals, and counter-evidence.');
  requireResult(service.synthesizeInsights({}, 'system'));

  await update('ideating', 82, 'Building one solution from the strongest converging evidence.');
  const proposal = enrichProposal(context.proposal, getWorkspace());
  const candidates = requireResult<FoundryWorkspace['candidates']>(service.generateIdeaCandidates({ proposals: [proposal] }, 'system'));
  const selected = candidates[0];
  if (!selected) throw new Error('LaunchPad could not assemble a supported solution from the available findings.');

  await update('stress_testing', 92, 'Testing the solution against limitations and transfer risks.');
  requireResult(service.stressTestCandidate({ candidateId: selected.id }, 'system'));
  const blueprint = requireResult(service.finalizeBlueprint({ candidateId: selected.id }, 'system'));

  await update('complete', 100, 'Your evidence-backed solution is ready.');
  return blueprint;
}
