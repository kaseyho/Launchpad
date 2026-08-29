import type { FoundryWorkspace } from '../domain/types';

type FetchWorkspace = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function saveWorkspaceSnapshot(
  workspace: FoundryWorkspace,
  signal?: AbortSignal,
  fetcher: FetchWorkspace = fetch,
) {
  const response = await fetcher('/api/workspace', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspace }),
    signal,
  });
  return response.ok;
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
