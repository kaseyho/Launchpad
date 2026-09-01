import { describe, expect, it, vi } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { loadLocalWorkspace, saveWorkspaceSnapshot } from './client-workspace';

describe('saveWorkspaceSnapshot', () => {
  it('uses a cancellable request without the browser keepalive body quota', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const controller = new AbortController();
    const workspace = createInitialWorkspace();

    await expect(saveWorkspaceSnapshot(workspace, controller.signal, fetcher)).resolves.toBe(true);

    expect(fetcher).toHaveBeenCalledWith('/api/workspace', expect.objectContaining({
      method: 'POST',
      signal: controller.signal,
    }));
    const request = fetcher.mock.calls[0][1] as RequestInit;
    expect(request.keepalive).toBeUndefined();
    expect(JSON.parse(request.body as string)).toEqual({ workspace });
  });

  it('keeps a valid browser-local snapshot when the server is unavailable', async () => {
    const workspace = createInitialWorkspace();
    workspace.version = 3;
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };

    await expect(saveWorkspaceSnapshot(workspace, undefined, fetcher, storage)).resolves.toBe(true);
    expect(loadLocalWorkspace(storage)?.version).toBe(3);
  });

  it('ignores a malformed browser-local snapshot', () => {
    const storage = { getItem: () => '{not-json' };
    expect(loadLocalWorkspace(storage)).toBeUndefined();
  });

  it('does not restore a report saved by the obsolete research pipeline', () => {
    const obsoleteWorkspace = createInitialWorkspace();
    obsoleteWorkspace.stage = 'FINALIZED';
    obsoleteWorkspace.problemBrief.problemStatement = 'hwo to find cheapest flight booking';
    const values = new Map<string, string>([
      ['launchpad.workspace.v2', JSON.stringify(obsoleteWorkspace)],
    ]);
    const storage = { getItem: (key: string) => values.get(key) ?? null };

    expect(loadLocalWorkspace(storage)).toBeUndefined();
  });
});
