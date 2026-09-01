import type { FoundryWorkspace } from '../domain/types';
import { decodeWorkspaceSnapshot } from './workspace-snapshot';
import { LOCAL_WORKSPACE_KEY } from './workspace-identity';

type FetchWorkspace = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function loadLocalWorkspace(storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage) {
  if (!storage) return undefined;
  const snapshot = storage.getItem(LOCAL_WORKSPACE_KEY);
  if (!snapshot) return undefined;
  try {
    return decodeWorkspaceSnapshot(snapshot);
  } catch {
    return undefined;
  }
}

function saveLocalWorkspace(workspace: FoundryWorkspace, storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage) {
  if (!storage) return false;
  try {
    storage.setItem(LOCAL_WORKSPACE_KEY, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}

export async function saveWorkspaceSnapshot(
  workspace: FoundryWorkspace,
  signal?: AbortSignal,
  fetcher: FetchWorkspace = fetch,
  storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
) {
  const savedLocally = saveLocalWorkspace(workspace, storage);
  try {
    const response = await fetcher('/api/workspace', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspace }),
      signal,
    });
    return response.ok || savedLocally;
  } catch (error) {
    if (isAbortError(error)) throw error;
    return savedLocally;
  }
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
