import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('POST /api/research', () => {
  it('rejects an undersized problem before calling the AI provider', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    vi.stubEnv('SOCLAAS_API_KEY', 'test-key');

    const response = await POST(new Request('https://launchpad.test/api/research', {
      method: 'POST',
      body: JSON.stringify({ problem: 'cheap flight' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'INVALID_RESEARCH_REQUEST' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns an actionable error instead of a fabricated fallback when AI is not configured', async () => {
    vi.stubEnv('SOCLAAS_API_KEY', '');

    const response = await POST(new Request('https://launchpad.test/api/research', {
      method: 'POST',
      body: JSON.stringify({ problem: 'find cheapest flight price booking' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'AI_RESEARCH_UNAVAILABLE',
      message: 'AI web research is not configured on this deployment.',
    });
  });

  it('uses the SoCLaaS-compatible Responses endpoint and configured model', async () => {
    vi.stubEnv('SOCLAAS_API_KEY', 'test-key');
    vi.stubEnv('SOCLAAS_MODEL', 'default');
    vi.stubEnv('SOCLAAS_BASE_URL', 'https://soclaas-api.comp.nus.edu.sg/v1');
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ output: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);

    await POST(new Request('https://launchpad.test/api/research', {
      method: 'POST',
      body: JSON.stringify({ problem: 'find cheapest flight price booking' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(fetcher).toHaveBeenCalledWith('https://soclaas-api.comp.nus.edu.sg/v1/responses', expect.anything());
    const [, init] = fetcher.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit | undefined];
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: 'default' });
  });
});
