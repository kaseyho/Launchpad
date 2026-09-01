import { fetchJsonWithRetry } from './provider-retry';

describe('WebMCP eval provider retry', () => {
  it('retries a transient provider response and returns the successful JSON payload', async () => {
    let attempts = 0;
    const payload = await fetchJsonWithRetry(async () => {
      attempts += 1;
      return attempts === 1
        ? new Response(JSON.stringify({ error: 'provider request failed' }), { status: 502 })
        : new Response(JSON.stringify({ id: 'response-2', output: [] }), { status: 200 });
    }, { maxAttempts: 2 });

    expect(payload).toEqual({ id: 'response-2', output: [] });
    expect(attempts).toBe(2);
  });

  it('does not retry a non-transient client error', async () => {
    let attempts = 0;

    await expect(fetchJsonWithRetry(async () => {
      attempts += 1;
      return new Response(JSON.stringify({ error: 'bad request' }), { status: 400 });
    }, { maxAttempts: 3 })).rejects.toThrow('HTTP 400');
    expect(attempts).toBe(1);
  });
});
