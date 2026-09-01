import {
  WEBMCP_AGENT_EVALS,
  scoreAgentEval,
  simulateAgentToolResult,
  type AgentToolCall,
} from './agent-evals';

describe('WebMCP model evals', () => {
  it('covers direct, ambiguous, policy, denied-consent, gap, stale-state, and mid-chain recovery cases', () => {
    expect(WEBMCP_AGENT_EVALS.map((item) => item.id)).toEqual([
      'direct-mission-start',
      'ambiguous-live-context-ingestion',
      'counterfactual-policy',
      'denied-consent-recovery',
      'missing-counter-evidence',
      'stale-version-recovery',
      'mid-chain-finalization-failure',
    ]);
  });

  it('scores required order and argument predicates', () => {
    const evalCase = WEBMCP_AGENT_EVALS.find((item) => item.id === 'counterfactual-policy')!;
    const calls: AgentToolCall[] = [
      { name: 'get_foundry_state', arguments: {} },
      { name: 'compare_evidence_policy', arguments: { allowed_source_types: ['paper', 'report'], minimum_corroboration: 2, include_private: false } },
      { name: 'apply_evidence_policy', arguments: { allowed_source_types: ['paper', 'report'], minimum_corroboration: 2, include_private: false } },
    ];

    expect(scoreAgentEval(evalCase, calls)).toMatchObject({ passed: true, failedChecks: [] });
  });

  it('fails unsafe sequencing, vague ingestion arguments, and missing recovery', () => {
    const ambiguous = WEBMCP_AGENT_EVALS.find((item) => item.id === 'ambiguous-live-context-ingestion')!;
    const result = scoreAgentEval(ambiguous, [
      { name: 'ingest_evidence_batch', arguments: { items: [{ title: 'Unknown' }] } },
    ]);

    expect(result.passed).toBe(false);
    expect(result.failedChecks).toEqual(expect.arrayContaining([
      expect.stringMatching(/order/i),
      expect.stringMatching(/provenance/i),
    ]));
  });

  it('gives the model a stage-faithful state receipt instead of an empty generic success', () => {
    const evalCase = WEBMCP_AGENT_EVALS.find((item) => item.id === 'direct-mission-start')!;

    expect(simulateAgentToolResult(evalCase, 'get_foundry_state')).toMatchObject({
      ok: true,
      workspace_version: 7,
      next_actions: ['research_and_ideate', 'update_problem_brief'],
      data: {
        stage: 'EMPTY',
        version: 7,
        problemBrief: {
          problemStatement: 'New administrators abandon setup before reaching first value.',
        },
      },
    });
  });

  it('preserves the configured recovery error in the simulated tool receipt', () => {
    const evalCase = WEBMCP_AGENT_EVALS.find((item) => item.id === 'denied-consent-recovery')!;

    expect(simulateAgentToolResult(evalCase, 'review_evidence_with_consent')).toMatchObject({
      ok: false,
      error: { code: 'USER_DECLINED' },
      workspace_version: 12,
      next_actions: ['get_foundry_state'],
    });
  });

  it('does not reveal a mid-chain finalization gap before the preview tool exposes it', () => {
    const evalCase = WEBMCP_AGENT_EVALS.find((item) => item.id === 'mid-chain-finalization-failure')!;

    expect(simulateAgentToolResult(evalCase, 'get_foundry_state')).toMatchObject({
      data: { warnings: [] },
      next_actions: ['preview_finalization'],
    });
  });

  it('accepts proactive gap closure before stress testing as a safe recovery path', () => {
    const evalCase = WEBMCP_AGENT_EVALS.find((item) => item.id === 'missing-counter-evidence')!;
    const calls: AgentToolCall[] = [
      { name: 'get_foundry_state', arguments: {} },
      { name: 'get_evidence_gaps', arguments: {} },
      {
        name: 'ingest_evidence_batch',
        arguments: {
          items: [{
            title: 'Counter signal',
            excerpt: 'Experienced users need control.',
            provenance: {
              origin: 'public_web',
              retrieved_at: '2026-08-31T09:00:00.000Z',
              retrieval_method: 'browser_agent',
            },
          }],
        },
      },
      { name: 'stress_test_candidate', arguments: { candidate_id: 'candidate-a' } },
    ];

    expect(scoreAgentEval(evalCase, calls)).toMatchObject({ passed: true, failedChecks: [] });
  });
});
