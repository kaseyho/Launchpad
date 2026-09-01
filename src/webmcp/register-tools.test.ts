import { createInMemoryFoundry } from '../domain/foundry-service';
import {
  MAX_TOOL_OUTPUT_CHARS,
  activeToolNamesForStage,
  getFoundryToolDefinitions,
  registerFoundryTools,
  type ModelContextLike,
  type WebMCPToolDefinition,
} from './register-tools';

describe('LaunchPad WebMCP registration', () => {
  it('advertises only tools that are useful at the current workspace stage', () => {
    expect(activeToolNamesForStage('EMPTY')).toEqual([
      'get_foundry_state',
      'research_and_ideate',
      'update_problem_brief',
    ]);
    expect(activeToolNamesForStage('CANDIDATES_READY')).toEqual(expect.arrayContaining([
      'get_foundry_state',
      'get_evidence_gaps',
      'inspect_candidate',
      'stress_test_candidate',
      'trace_evidence',
    ]));
    expect(activeToolNamesForStage('CANDIDATES_READY')).not.toEqual(expect.arrayContaining([
      'update_problem_brief',
      'plan_research',
      'research_and_ideate',
    ]));
  });

  it('becomes ready only after every async registration succeeds and aborts registrations on disposal', async () => {
    const definitions: WebMCPToolDefinition[] = [];
    const signals: AbortSignal[] = [];
    const resolvers: Array<() => void> = [];
    const context: ModelContextLike = {
      registerTool(definition, options) {
        definitions.push(definition);
        if (options?.signal) signals.push(options.signal);
        return new Promise<void>((resolve) => resolvers.push(resolve));
      },
    };
    const { service } = createInMemoryFoundry();

    const registration = registerFoundryTools(context, service, { stage: 'EMPTY' });
    let ready = false;
    void registration.ready.then(() => { ready = true; });
    await Promise.resolve();

    expect(ready).toBe(false);
    expect(definitions.map((tool) => tool.name)).toEqual(activeToolNamesForStage('EMPTY'));
    expect(signals).toHaveLength(definitions.length);
    resolvers.forEach((resolve) => resolve());
    await registration.ready;
    expect(ready).toBe(true);

    registration.dispose();
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it('rejects readiness and cancels sibling registrations when one registration fails', async () => {
    const signals: AbortSignal[] = [];
    const context: ModelContextLike = {
      registerTool(definition, options) {
        if (options?.signal) signals.push(options.signal);
        if (definition.name === 'research_and_ideate') return Promise.reject(new Error('registration unavailable'));
        return Promise.resolve();
      },
    };
    const { service } = createInMemoryFoundry();

    const registration = registerFoundryTools(context, service, { stage: 'EMPTY' });

    await expect(registration.ready).rejects.toThrow('registration unavailable');
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it('turns synchronous registration throws into a rejected readiness promise', async () => {
    const context: ModelContextLike = {
      registerTool(definition) {
        if (definition.name === 'research_and_ideate') throw new Error('synchronous registration unavailable');
      },
    };
    const { service } = createInMemoryFoundry();

    const registration = registerFoundryTools(context, service, { stage: 'EMPTY' });

    await expect(registration.ready).rejects.toThrow('synchronous registration unavailable');
  });

  it('propagates the browser agent cancellation signal into autonomous research', async () => {
    const { service } = createInMemoryFoundry();
    const executionController = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const definitions = getFoundryToolDefinitions(service, {
      stage: 'EMPTY',
      onResearch: async (_problem, signal) => {
        receivedSignal = signal;
        return true;
      },
    });

    const run = definitions.find((tool) => tool.name === 'research_and_ideate');
    const result = await run?.execute(
      { problem_statement: 'Food-bank volunteers struggle to coordinate urgent deliveries.' },
      { signal: executionController.signal },
    );

    expect(receivedSignal).toBe(executionController.signal);
    expect(result?.isError).not.toBe(true);
  });

  it('uses honest read-only and untrusted-content annotations', () => {
    const { service } = createInMemoryFoundry();
    const definitions = getFoundryToolDefinitions(service, { stage: 'CANDIDATES_READY' });
    const byName = Object.fromEntries(definitions.map((tool) => [tool.name, tool]));

    expect(byName.get_foundry_state.annotations?.readOnlyHint).toBe(true);
    expect(byName.get_evidence_gaps.annotations).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
    expect(byName.inspect_candidate.annotations).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
    expect(byName.trace_evidence.annotations?.readOnlyHint).not.toBe(true);
    expect(byName.trace_evidence.annotations?.untrustedContentHint).toBe(true);
    expect(definitions.every((tool) => tool.inputSchema.additionalProperties === false)).toBe(true);
  });

  it('exposes a bounded provenance-aware batch ingestion tool during sourcing', () => {
    const { service } = createInMemoryFoundry();
    const definitions = getFoundryToolDefinitions(service, { stage: 'SOURCING' });
    const batch = definitions.find((tool) => tool.name === 'ingest_evidence_batch');
    const items = batch?.inputSchema.properties.items as { minItems?: number; maxItems?: number };

    expect(batch?.annotations?.untrustedContentHint).toBe(true);
    expect(items).toMatchObject({ minItems: 1, maxItems: 8 });
  });

  it('exposes pure policy comparison and an explicit policy application action after candidates exist', () => {
    const { service } = createInMemoryFoundry();
    const definitions = getFoundryToolDefinitions(service, { stage: 'CANDIDATES_READY' });
    const compare = definitions.find((tool) => tool.name === 'compare_evidence_policy');
    const apply = definitions.find((tool) => tool.name === 'apply_evidence_policy');

    expect(compare?.annotations).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
    expect(apply?.annotations?.readOnlyHint).not.toBe(true);
    expect(compare?.inputSchema.properties.minimum_corroboration).toMatchObject({ minimum: 1 });
  });

  it('surfaces the pure policy comparison for the visible judge rail', async () => {
    const foundry = createInMemoryFoundry();
    let comparison: unknown;
    let comparedVersion: number | undefined;
    const compare = getFoundryToolDefinitions(foundry.service, {
      stage: 'CANDIDATES_READY',
      onPolicyComparison: (value, workspaceVersion) => { comparison = value; comparedVersion = workspaceVersion; },
    }).find((tool) => tool.name === 'compare_evidence_policy');

    await compare?.execute({ minimum_corroboration: 2, include_private: false });

    expect(comparison).toEqual(expect.objectContaining({
      baselineRanking: expect.any(Array),
      proposedRanking: expect.any(Array),
      recommendationChanged: expect.any(Boolean),
    }));
    expect(comparedVersion).toBe(foundry.getWorkspace().version);
  });

  it('keeps every structured gap recovery tool available through pre-final stages', () => {
    for (const stage of ['EVIDENCE_REVIEW', 'INSIGHTS_READY', 'CANDIDATES_READY', 'STRESS_TESTING', 'BLUEPRINT_READY'] as const) {
      expect(activeToolNamesForStage(stage)).toEqual(expect.arrayContaining([
        'search_sources', 'import_source', 'ingest_evidence_batch', 'extract_findings', 'review_evidence_with_consent',
      ]));
    }
  });

  it('previews sensitive actions and pauses evidence acceptance for exact human consent', async () => {
    const foundry = createInMemoryFoundry();
    foundry.service.updateProblemBrief({ problemStatement: 'A decision needs trustworthy evidence.' });
    const imported = foundry.service.importSource({
      title: 'Public report', sourceType: 'report', lane: 'market', url: 'https://evidence.example.org/report', excerpt: 'A relevant finding for the decision.',
    });
    const sourceId = imported.ok ? imported.data.id : 'missing';
    foundry.service.extractFindings({ sourceIds: [sourceId] });
    const findingId = foundry.getWorkspace().findings[0].id;
    const version = foundry.getWorkspace().version;
    let approve: ((approved: boolean) => void) | undefined;
    const consentRequests: unknown[] = [];
    const definitions = getFoundryToolDefinitions(foundry.service, {
      stage: 'EVIDENCE_REVIEW',
      requestConsent: async (request) => {
        consentRequests.push(request);
        return new Promise<boolean>((resolve) => { approve = resolve; });
      },
    });
    const review = definitions.find((tool) => tool.name === 'review_evidence_with_consent');

    const pending = review?.execute({ decision: 'accept', finding_ids: [findingId], expected_workspace_version: version });
    await Promise.resolve();
    expect(foundry.getWorkspace().findings[0].reviewStatus).toBe('pending');
    expect(consentRequests).toEqual([expect.objectContaining({ affectedIds: [findingId], workspaceVersion: version, privacyScope: 'public_only' })]);

    approve?.(true);
    const result = await pending;
    expect(result?.isError).not.toBe(true);
    expect(foundry.getWorkspace().findings[0].reviewStatus).toBe('accepted');
  });

  it('declines or rejects stale sensitive actions without mutating evidence', async () => {
    const foundry = createInMemoryFoundry();
    const initial = structuredClone(foundry.getWorkspace());
    let consentCalls = 0;
    const definitions = getFoundryToolDefinitions(foundry.service, {
      stage: 'EVIDENCE_REVIEW',
      requestConsent: async () => { consentCalls += 1; return false; },
    });
    const review = definitions.find((tool) => tool.name === 'review_evidence_with_consent');

    const stale = await review?.execute({ decision: 'accept', finding_ids: ['finding-a'], expected_workspace_version: 999 });
    expect(stale?.isError).toBe(true);
    expect(stale?.content[0]?.text).toContain('STALE_WORKSPACE_VERSION');
    expect(consentCalls).toBe(0);
    expect(foundry.getWorkspace()).toEqual(initial);
  });

  it('handles browser execution options that omit the optional cancellation signal', async () => {
    const foundry = createInMemoryFoundry();
    const definitions = getFoundryToolDefinitions(foundry.service, {
      stage: 'EVIDENCE_REVIEW',
      requestConsent: async () => false,
    });
    const review = definitions.find((tool) => tool.name === 'review_evidence_with_consent');

    const result = await review?.execute({
      decision: 'accept',
      finding_ids: ['finding-a'],
      expected_workspace_version: foundry.getWorkspace().version,
    }, {} as { signal: AbortSignal });

    expect(result?.isError).toBe(true);
    expect(result?.content[0]?.text).toContain('USER_DECLINED');
  });

  it('exposes pure finalization/export previews and consent-gated commit names, never direct sensitive tools', () => {
    const { service } = createInMemoryFoundry();
    const blueprintDefinitions = getFoundryToolDefinitions(service, { stage: 'BLUEPRINT_READY' });
    const finalizedDefinitions = getFoundryToolDefinitions(service, { stage: 'FINALIZED' });

    expect(blueprintDefinitions.map((tool) => tool.name)).toEqual(expect.arrayContaining(['preview_finalization', 'finalize_blueprint_with_consent']));
    expect(finalizedDefinitions.map((tool) => tool.name)).toEqual(expect.arrayContaining(['preview_export', 'export_blueprint_with_consent']));
    expect([...blueprintDefinitions, ...finalizedDefinitions].map((tool) => tool.name)).not.toEqual(expect.arrayContaining(['finalize_blueprint', 'export_blueprint', 'review_findings']));
  });

  it('returns compact versioned receipts that tell an agent what changed and what to do next', async () => {
    const { service } = createInMemoryFoundry();
    const definitions = getFoundryToolDefinitions(service, { stage: 'EMPTY' });
    const update = definitions.find((tool) => tool.name === 'update_problem_brief');

    const result = await update?.execute({
      problem_statement: 'New administrators abandon setup before reaching first value.',
      target_audience: 'New administrators',
      desired_outcome: 'Improve activation',
    });
    const receiptText = result?.content[0]?.text ?? '';
    const receipt = JSON.parse(receiptText) as Record<string, unknown>;

    expect(receiptText.length).toBeLessThanOrEqual(MAX_TOOL_OUTPUT_CHARS);
    expect(receipt).toMatchObject({
      ok: true,
      modified_ids: ['problem-brief'],
    });
    expect(receipt.workspace_version).toBeGreaterThan(0);
    expect(receipt.next_actions).toEqual(expect.arrayContaining(['plan_research']));
  });

  it('returns a versioned one-shot receipt instead of bypassing the receipt contract', async () => {
    const foundry = createInMemoryFoundry();
    const run = getFoundryToolDefinitions(foundry.service, {
      stage: 'EMPTY',
      onResearch: async () => {
        foundry.service.updateProblemBrief({ problemStatement: 'A grounded one-shot problem.' }, 'agent');
        return true;
      },
      requestConsent: async () => true,
    }).find((tool) => tool.name === 'research_and_ideate');

    const result = await run?.execute({ problem_statement: 'A grounded one-shot problem.' });
    const receipt = JSON.parse(result?.content[0]?.text ?? '{}');

    expect(receipt).toMatchObject({ ok: true, workspace_version: 2, modified_ids: [], next_actions: expect.any(Array) });
  });

  it('keeps candidate identity and decision fields in compact inspect receipts', async () => {
    const foundry = createInMemoryFoundry();
    foundry.service.updateProblemBrief({ problemStatement: 'A mid-market B2B SaaS product loses new administrators during setup.' });
    foundry.service.planResearch({ focus: 'activation' });
    for (const lane of ['first_party', 'customer', 'academic', 'market', 'community', 'counter'] as const) foundry.service.searchSources({ lane });
    foundry.service.extractFindings({ sourceIds: foundry.getWorkspace().sources.map((source) => source.id) });
    foundry.service.reviewFindings({ decision: 'accept', findingIds: foundry.getWorkspace().findings.map((finding) => finding.id) });
    foundry.service.synthesizeInsights();
    foundry.service.generateIdeaCandidates({ count: 3 });
    const inspect = getFoundryToolDefinitions(foundry.service, { stage: 'CANDIDATES_READY' }).find((tool) => tool.name === 'inspect_candidate');

    const result = await inspect?.execute({ candidate_id: 'candidate-a' });
    const receipt = JSON.parse(result?.content[0]?.text ?? '{}');

    expect(result?.content[0]?.text.length).toBeLessThanOrEqual(MAX_TOOL_OUTPUT_CHARS);
    expect(receipt.data).toEqual(expect.objectContaining({
      candidate: expect.objectContaining({ id: 'candidate-a', name: expect.any(String), score: expect.any(Number), coverage: expect.any(Number) }),
    }));
  });

  it('always returns valid bounded JSON even when an error message is extremely large', async () => {
    const foundry = createInMemoryFoundry();
    const inspect = getFoundryToolDefinitions(foundry.service, { stage: 'CANDIDATES_READY' }).find((tool) => tool.name === 'inspect_candidate');

    const result = await inspect?.execute({ candidate_id: `missing-${'x'.repeat(5000)}` });
    const text = result?.content[0]?.text ?? '';

    expect(text.length).toBeLessThanOrEqual(MAX_TOOL_OUTPUT_CHARS);
    expect(() => JSON.parse(text)).not.toThrow();
    expect(JSON.parse(text)).toMatchObject({ ok: false, workspace_version: 1, error: { code: 'CANDIDATE_NOT_FOUND', recoverable: true } });
  });

  it('returns structured recoverable state-gate failures', async () => {
    const { service } = createInMemoryFoundry();
    const definitions = getFoundryToolDefinitions(service, { stage: 'CANDIDATES_READY' });
    const generate = getFoundryToolDefinitions(service, { stage: 'INSIGHTS_READY' })
      .find((tool) => tool.name === 'generate_idea_candidates');

    expect(definitions.find((tool) => tool.name === 'generate_idea_candidates')).toBeUndefined();
    const result = await generate?.execute({ count: 3 });
    const receipt = JSON.parse(result?.content[0]?.text ?? '{}') as Record<string, unknown>;

    expect(result?.isError).toBe(true);
    expect(receipt).toMatchObject({
      ok: false,
      modified_ids: [],
      error: { code: 'INSUFFICIENT_EVIDENCE', recoverable: true },
    });
    expect(receipt.workspace_version).toBeGreaterThan(0);
  });
});
