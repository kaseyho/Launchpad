const TRANSIENT_PROVIDER_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export async function fetchJsonWithRetry<T>(
  request: () => Promise<Response>,
  options: { maxAttempts?: number } = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await request();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
      continue;
    }

    if (response.ok) return await response.json() as T;
    const error = new Error(`Provider returned HTTP ${response.status}.`);
    if (!TRANSIENT_PROVIDER_STATUSES.has(response.status) || attempt === maxAttempts) throw error;
    lastError = error;
  }

  throw lastError instanceof Error ? lastError : new Error('Provider request failed.');
}
