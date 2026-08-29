import {
  createInitialWorkspace,
  createInMemoryFoundry,
} from './foundry-service';

function prepareAcceptedEvidence() {
  const foundry = createInMemoryFoundry();
  const { service } = foundry;

  service.updateProblemBrief({
    problemStatement: 'A mid-market B2B SaaS product loses new administrators during setup.',
    targetAudience: 'New administrators at mid-market B2B SaaS customers',
    desiredOutcome: 'Improve first-session activation',
    timeframe: 'Six weeks',
    constraints: ['No additional support headcount'],
  });
  service.planResearch({ focus: 'first-session activation' });
  for (const lane of ['first_party', 'customer', 'academic', 'market', 'community', 'counter'] as const) {
    service.searchSources({ lane });
  }
  const sourceIds = foundry.getWorkspace().sources.map((source) => source.id);
  service.extractFindings({ sourceIds });
  service.reviewFindings({ decision: 'accept', findingIds: foundry.getWorkspace().findings.map((finding) => finding.id) });

  return foundry;
}

describe('FoundryService', () => {
  it('starts empty and moves to a defined problem while recording the actor and version', () => {
    const foundry = createInMemoryFoundry();

    expect(foundry.getWorkspace()).toMatchObject({ stage: 'EMPTY', version: 1 });

    const result = foundry.service.updateProblemBrief({
      problemStatement: 'Setup abandonment is high.',
      targetAudience: 'New administrators',
      desiredOutcome: 'Increase activation',
      timeframe: 'Six weeks',
    }, 'human');

    expect(result.ok).toBe(true);
    expect(foundry.getWorkspace()).toMatchObject({ stage: 'PROBLEM_DEFINED', version: 2 });
    expect(foundry.getWorkspace().activity.at(-1)).toMatchObject({
      actor: 'human',
      toolName: 'update_problem_brief',
      workspaceVersion: 2,
    });
  });

  it('rejects candidate generation before the evidence gate with actionable counts', () => {
    const { service } = createInMemoryFoundry();

    const result = service.generateIdeaCandidates({ count: 3 });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'INSUFFICIENT_EVIDENCE',
        message: 'At least 4 accepted findings across 2 evidence categories are required.',
        required: { acceptedFindings: 4, evidenceCategories: 2 },
        current: { acceptedFindings: 0, evidenceCategories: 0 },
      },
    });
  });

  it('keeps research planning and seeded source search idempotent', () => {
    const foundry = createInMemoryFoundry();
    foundry.service.updateProblemBrief({ problemStatement: 'Setup abandonment is high.' });

    foundry.service.planResearch({ focus: 'activation' });
    foundry.service.planResearch({ focus: 'activation' });
    foundry.service.searchSources({ lane: 'academic' });
    foundry.service.searchSources({ lane: 'academic' });

    expect(foundry.getWorkspace().researchQuestions).toHaveLength(6);
    expect(foundry.getWorkspace().sources.filter((source) => source.lane === 'academic')).toHaveLength(2);
  });

  it('extracts only findings with complete citation objects and preserves numerical context', () => {
    const foundry = prepareAcceptedEvidence();
    const numerical = foundry.getWorkspace().findings.find((finding) => finding.value === 43);

    expect(foundry.getWorkspace().findings.length).toBeGreaterThanOrEqual(8);
    expect(foundry.getWorkspace().findings.every((finding) => (
      finding.citation.sourceTitle.length > 0
      && finding.citation.exactExcerpt.length > 0
      && finding.citation.retrievedAt.length > 0
    ))).toBe(true);
    expect(numerical).toMatchObject({
      unit: 'percent',
      population: '420 new-administrator sessions',
      timeframe: 'Last 90 days',
      synthetic: true,
    });
  });

  it('creates three evidence-linked candidates only after accepted insights exist', () => {
    const foundry = prepareAcceptedEvidence();

    expect(foundry.service.synthesizeInsights({} as never).ok).toBe(true);
    const result = foundry.service.generateIdeaCandidates({ count: 3 });

    expect(result.ok).toBe(true);
    expect(foundry.getWorkspace().candidates).toHaveLength(3);
    expect(foundry.getWorkspace().evidenceLinks.length).toBeGreaterThanOrEqual(12);
    expect(foundry.getWorkspace().selectedCandidateId).toBe('candidate-a');
    expect(foundry.getWorkspace().stage).toBe('CANDIDATES_READY');
  });

  it('makes the recommendation change when community anecdotes are excluded', () => {
    const foundry = prepareAcceptedEvidence();
    foundry.service.synthesizeInsights({} as never);
    foundry.service.generateIdeaCandidates({ count: 3 });
    const before = foundry.getWorkspace().candidates.find((candidate) => candidate.id === 'candidate-a');

    const result = foundry.service.reviewFindings({
      decision: 'reject',
      evidenceType: 'community_anecdote',
      note: 'Human requested stronger evidence only.',
    });
    const after = foundry.getWorkspace().candidates.find((candidate) => candidate.id === 'candidate-a');

    expect(result.ok).toBe(true);
    expect(before?.coverage).toBeGreaterThan(after?.coverage ?? 100);
    expect(after?.unsupportedComponents.length).toBeGreaterThan(0);
    expect(foundry.getWorkspace().selectedCandidateId).toBe('candidate-b');
  });

  it('stress-tests, traces, finalizes, and exports the selected idea with caveats and a falsifiable experiment', () => {
    const foundry = prepareAcceptedEvidence();
    foundry.service.synthesizeInsights({} as never);
    foundry.service.generateIdeaCandidates({ count: 3 });
    foundry.service.reviewFindings({ decision: 'reject', evidenceType: 'community_anecdote' });

    const stress = foundry.service.stressTestCandidate({ candidateId: 'candidate-b' });
    const trace = foundry.service.traceEvidence({ candidateId: 'candidate-b', componentPath: 'features.0' });
    const finalized = foundry.service.finalizeBlueprint({ candidateId: 'candidate-b' });
    const exported = foundry.service.exportBlueprint({ format: 'markdown' });

    expect(stress.ok).toBe(true);
    expect(trace.ok && trace.data.nodes.map((node) => node.kind)).toEqual([
      'idea_component', 'insight', 'finding', 'source',
    ]);
    expect(finalized.ok && finalized.data).toMatchObject({
      status: 'finalized',
      validationPlan: {
        successMetric: expect.stringContaining('activation'),
        failureThreshold: expect.any(String),
      },
    });
    expect(exported.ok && exported.data.content).toContain('## Why this can work');
    expect(exported.ok && exported.data.content).toContain('## What must be true');
    expect(exported.ok && exported.data.content).toContain('## What to test next');
    expect(foundry.getWorkspace().stage).toBe('FINALIZED');
  });

  it('returns a fresh independent workspace object for resets', () => {
    const one = createInitialWorkspace();
    const two = createInitialWorkspace();
    one.problemBrief.constraints.push('Mutated');

    expect(two.problemBrief.constraints).toEqual([]);
  });

  it('keeps metadata-only sources out of evidence when no exact passage is available', () => {
    const foundry = createInMemoryFoundry();
    foundry.service.updateProblemBrief({ problemStatement: 'A new decision needs evidence.' });
    const imported = foundry.service.importSource({
      title: 'Metadata-only paper',
      sourceType: 'paper',
      url: 'https://doi.org/10.1000/metadata-only',
      lane: 'academic',
    });
    const sourceId = imported.ok ? imported.data.id : 'missing';

    expect(foundry.service.extractFindings({ sourceIds: [sourceId] })).toEqual({
      ok: false,
      error: {
        code: 'NO_EXACT_PASSAGE',
        message: 'No exact supporting passage is available. Add a pasted excerpt or upload readable text before extraction.',
      },
    });
    expect(foundry.getWorkspace().findings).toHaveLength(0);
  });
});
