import { createInMemoryFoundry } from '../domain/foundry-service';
import { registerFoundryTools, type ModelContextLike, type WebMCPToolDefinition } from './register-tools';

describe('LaunchPad WebMCP registration', () => {
  it('uses the official abort-signal lifecycle and reports when every tool is registered', async () => {
    const registrations: Array<{ definition: WebMCPToolDefinition; signal?: AbortSignal }> = [];
    const context: ModelContextLike = {
      registerTool(definition, options) {
        registrations.push({ definition, signal: options?.signal });
        return Promise.resolve();
      },
    };
    const { service } = createInMemoryFoundry();

    const registration = registerFoundryTools(context, service);
    await registration.ready;

    expect(registrations).toHaveLength(17);
    expect(registrations.every(({ signal }) => signal && !signal.aborted)).toBe(true);

    registration.unregister();
    expect(registrations.every(({ signal }) => signal?.aborted)).toBe(true);
  });

  it('registers the one-shot run plus the complete composable control plane with narrow schemas', () => {
    const definitions: WebMCPToolDefinition[] = [];
    const context: ModelContextLike = {
      registerTool(definition) { definitions.push(definition); },
      unregisterTool() {},
    };
    const { service } = createInMemoryFoundry();

    registerFoundryTools(context, service);

    expect(definitions).toHaveLength(17);
    expect(definitions.map((tool) => tool.name)).toEqual([
      'get_foundry_state',
      'research_and_ideate',
      'update_problem_brief',
      'plan_research',
      'search_sources',
      'import_source',
      'extract_findings',
      'review_findings',
      'get_evidence_gaps',
      'synthesize_insights',
      'generate_idea_candidates',
      'inspect_candidate',
      'stress_test_candidate',
      'revise_candidate',
      'trace_evidence',
      'finalize_blueprint',
      'export_blueprint',
    ]);
    expect(definitions.filter((tool) => tool.annotations?.readOnlyHint).map((tool) => tool.name)).toEqual([
      'get_foundry_state',
      'get_evidence_gaps',
      'inspect_candidate',
      'trace_evidence',
    ]);
    expect(definitions.every((tool) => tool.inputSchema.additionalProperties === false)).toBe(true);
  });

  it('exposes a one-shot autonomous research entry point to browser agents', async () => {
    const definitions: WebMCPToolDefinition[] = [];
    const context: ModelContextLike = { registerTool(definition) { definitions.push(definition); } };
    const { service } = createInMemoryFoundry();
    let submittedProblem = '';
    registerFoundryTools(context, service, { onResearch: async (problem) => { submittedProblem = problem ?? ''; return true; } });

    const run = definitions.find((tool) => tool.name === 'research_and_ideate');
    const result = await run?.execute({ problem_statement: 'Food-bank volunteers struggle to coordinate urgent deliveries.' });

    expect(submittedProblem).toContain('Food-bank volunteers');
    expect(result?.isError).not.toBe(true);
    expect(result?.content[0]?.text).toContain('solution is ready');
  });

  it('uses the same service as the human UI so agent calls change visible workspace state', async () => {
    const definitions: WebMCPToolDefinition[] = [];
    const context: ModelContextLike = {
      registerTool(definition) { definitions.push(definition); },
      unregisterTool() {},
    };
    const foundry = createInMemoryFoundry();
    registerFoundryTools(context, foundry.service);

    const update = definitions.find((tool) => tool.name === 'update_problem_brief');
    const result = await update?.execute({
      problem_statement: 'New administrators abandon setup before reaching first value.',
      target_audience: 'New administrators',
      desired_outcome: 'Improve activation',
    });

    expect(result?.content[0]?.text).toContain('Problem saved');
    expect(foundry.getWorkspace().stage).toBe('PROBLEM_DEFINED');
    expect(foundry.getWorkspace().activity.at(-1)?.actor).toBe('agent');

    const read = definitions.find((tool) => tool.name === 'get_foundry_state');
    const state = await read?.execute({});
    expect(state?.content[0]?.text).toContain('New administrators abandon setup');
  });

  it('accepts structured, problem-specific candidate proposals from the browser agent', () => {
    const definitions: WebMCPToolDefinition[] = [];
    const context: ModelContextLike = { registerTool(definition) { definitions.push(definition); } };
    const { service } = createInMemoryFoundry();
    registerFoundryTools(context, service);

    const generate = definitions.find((tool) => tool.name === 'generate_idea_candidates');
    const proposals = generate?.inputSchema.properties.proposals as { type?: string; maxItems?: number };

    expect(proposals).toMatchObject({ type: 'array', maxItems: 3 });
    expect(generate?.description).toContain('problem-specific');
  });

  it('returns structured, actionable state-gate failures instead of hiding errors', async () => {
    const definitions: WebMCPToolDefinition[] = [];
    const context: ModelContextLike = { registerTool(definition) { definitions.push(definition); } };
    const { service } = createInMemoryFoundry();
    registerFoundryTools(context, service);

    const generate = definitions.find((tool) => tool.name === 'generate_idea_candidates');
    const result = await generate?.execute({ count: 3 });

    expect(result?.isError).toBe(true);
    expect(result?.content[0]?.text).toContain('INSUFFICIENT_EVIDENCE');
    expect(result?.content[0]?.text).toContain('acceptedFindings');
  });
});
