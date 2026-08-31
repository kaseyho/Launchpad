import { researchWithProvider } from '../../../src/research/openai-research';

export const runtime = 'edge';

function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

async function runtimeValue(key: 'SOCLAAS_API_KEY' | 'SOCLAAS_MODEL' | 'SOCLAAS_BASE_URL') {
  if (process.env[key]) return process.env[key] || '';
  try {
    const cloudflareWorkersModule = 'cloudflare:workers';
    const { env } = await import(/* @vite-ignore */ cloudflareWorkersModule) as typeof import('cloudflare:workers');
    return String(env[key] || '');
  } catch {
    return '';
  }
}

export async function POST(request: Request) {
  let problem = '';
  try {
    const body = await request.json() as { problem?: unknown };
    problem = typeof body.problem === 'string' ? body.problem.trim() : '';
  } catch {
    return response({ error: 'INVALID_RESEARCH_REQUEST', message: 'Submit a valid JSON problem statement.' }, 400);
  }
  if (problem.length < 20) {
    return response({ error: 'INVALID_RESEARCH_REQUEST', message: 'Give LaunchPad enough context to research—at least 20 characters.' }, 400);
  }

  try {
    const [apiKey, configuredModel, configuredBaseUrl] = await Promise.all([
      runtimeValue('SOCLAAS_API_KEY'),
      runtimeValue('SOCLAAS_MODEL'),
      runtimeValue('SOCLAAS_BASE_URL'),
    ]);
    const report = await researchWithProvider(problem, {
      apiKey,
      model: configuredModel || 'default',
      baseUrl: configuredBaseUrl || 'https://soclaas-api.comp.nus.edu.sg/v1',
      signal: request.signal,
    });
    return response(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI web research is temporarily unavailable.';
    const configurationError = /not configured/i.test(message);
    return response({
      error: configurationError ? 'AI_RESEARCH_UNAVAILABLE' : 'AI_RESEARCH_FAILED',
      message: configurationError ? message : `LaunchPad could not complete grounded web research. ${message}`,
    }, configurationError ? 503 : 502);
  }
}
