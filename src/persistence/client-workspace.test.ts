import { describe, expect, it, vi } from 'vitest';
import { createInitialWorkspace } from '../domain/foundry-service';
import { saveWorkspaceSnapshot } from './client-workspace';

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
});
