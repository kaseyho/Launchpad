import { createInMemoryFoundry } from '../domain/foundry-service';
import { registerFoundryTools, type ModelContextLike, type WebMCPToolDefinition } from './register-tools';

describe('ProofFoundry WebMCP registration', () => {
  it('registers the complete composable 16-tool control plane with narrow schemas', () => {
    const definitions: WebMCPToolDefinition[] = [];
    const context: ModelContextLike = {
      registerTool(definition) { definitions.push(definition); },
      unregisterTool() {},
    };
    const { service } = createInMemoryFoundry();

    registerFoundryTools(context, service);

    expect(definitions).toHaveLength(16);
    expect(definitions.map((tool) => tool.name)).toEqual([
      'get_foundry_state',
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

    expect(result?.content[0]?.text).toContain('Problem brief updated');
    expect(foundry.getWorkspace().stage).toBe('PROBLEM_DEFINED');
    expect(foundry.getWorkspace().activity.at(-1)?.actor).toBe('agent');
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
