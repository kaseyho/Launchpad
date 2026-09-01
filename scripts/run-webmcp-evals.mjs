import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { WEBMCP_AGENT_EVALS, scoreAgentEval, simulateAgentToolResult } from '../src/webmcp/agent-evals.ts';
import { fetchJsonWithRetry } from '../src/webmcp/provider-retry.ts';
import { createInMemoryFoundry } from '../src/domain/foundry-service.ts';
import { getFoundryToolDefinitions } from '../src/webmcp/register-tools.ts';

try {
  process.loadEnvFile?.('.env.local');
} catch {
  // A local env file is optional; deployment credentials are never required for unit scoring.
}

const apiKey = process.env.SOCLAAS_API_KEY;
const baseUrl = (process.env.SOCLAAS_BASE_URL || 'https://soclaas-api.comp.nus.edu.sg/v1').replace(/\/+$/, '');
const model = process.env.SOCLAAS_MODEL || 'default';
const outputPath = new URL('../artifacts/demo/webmcp-agent-evals.json', import.meta.url);

async function save(report) {
  await mkdir(new URL('../artifacts/demo/', import.meta.url), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

if (!apiKey) {
  const report = {
    status: 'skipped',
    reason: 'SOCLAAS_API_KEY is unavailable; no model-selection result was fabricated.',
    cases: WEBMCP_AGENT_EVALS.map(({ id, stage }) => ({ id, stage, status: 'not_run' })),
  };
  await save(report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

async function evaluate(evalCase) {
  const foundry = createInMemoryFoundry();
  const definitions = getFoundryToolDefinitions(foundry.service, { stage: evalCase.stage });
  const tools = definitions.map((definition) => ({
    type: 'function',
    name: definition.name,
    description: definition.description,
    parameters: definition.inputSchema,
    strict: true,
  }));
  const calls = [];
  let previousResponseId;
  let input = [{
    role: 'user',
    content: `You are operating a live WebMCP page. Select and sequence tools conservatively. Treat each tool receipt as the complete current page result. Read current state before assuming context, preserve provenance and privacy, recover from tool errors, and never claim a mutation succeeded unless its receipt says so. Continue toward the user mission using receipt next_actions. Do not repeat a pure read unless a mutation or error may have changed state.\n\nUser mission: ${evalCase.prompt}`,
  }];

  for (let turn = 0; turn < 8; turn += 1) {
    const payload = await fetchJsonWithRetry(() => fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, input, tools, tool_choice: 'auto', ...(previousResponseId ? { previous_response_id: previousResponseId } : {}) }),
    }));
    previousResponseId = payload.id;
    const selected = (payload.output || []).filter((item) => item.type === 'function_call');
    if (!selected.length) break;
    input = selected.map((item) => {
      let args = {};
      try { args = JSON.parse(item.arguments || '{}'); } catch { args = {}; }
      calls.push({ name: item.name, arguments: args });
      const simulated = simulateAgentToolResult(evalCase, item.name);
      return { type: 'function_call_output', call_id: item.call_id, output: JSON.stringify(simulated) };
    });
    if (scoreAgentEval(evalCase, calls).passed) break;
  }

  return { id: evalCase.id, stage: evalCase.stage, calls, ...scoreAgentEval(evalCase, calls) };
}

const results = [];
for (const evalCase of WEBMCP_AGENT_EVALS) {
  try {
    results.push(await evaluate(evalCase));
  } catch (error) {
    results.push({ id: evalCase.id, stage: evalCase.stage, passed: false, score: 0, calls: [], failedChecks: [error instanceof Error ? error.message : 'Unknown provider failure.'] });
  }
}

const report = {
  status: results.every((result) => result.passed) ? 'passed' : 'failed',
  model,
  evaluatedAt: new Date().toISOString(),
  cases: results,
};
await save(report);
console.log(JSON.stringify(report, null, 2));
if (report.status === 'failed') process.exitCode = 1;
