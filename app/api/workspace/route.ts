import { deleteWorkspace, loadWorkspace, saveWorkspace } from '../../../db/storage';
import { WORKSPACE_COOKIE_NAME } from '../../../src/persistence/workspace-identity';
import { decodeWorkspaceSnapshot } from '../../../src/persistence/workspace-snapshot';

export const runtime = 'edge';

function response(body: unknown, status = 200, cookie?: string) {
  const headers = new Headers({ 'cache-control': 'no-store' });
  if (cookie) headers.set('set-cookie', cookie);
  return Response.json(body, { status, headers });
}

function storageIdentity(request: Request) {
  const existing = request.headers.get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${WORKSPACE_COOKIE_NAME}=`))
    ?.slice(`${WORKSPACE_COOKIE_NAME}=`.length);
  if (existing && /^workspace-[a-f0-9-]{36}$/.test(existing)) return { id: existing };
  const id = `workspace-${crypto.randomUUID()}`;
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return { id, cookie: `${WORKSPACE_COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}` };
}

export async function GET(request: Request) {
  try {
    const identity = storageIdentity(request);
    const workspace = await loadWorkspace(identity.id);
    return workspace ? response({ workspace }, 200, identity.cookie) : response({ workspace: null }, 404, identity.cookie);
  } catch (error) {
    return response({ error: 'WORKSPACE_LOAD_FAILED', message: error instanceof Error ? error.message : 'Unable to load workspace.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const identity = storageIdentity(request);
    const body = await request.json() as { workspace?: unknown };
    const workspace = decodeWorkspaceSnapshot(JSON.stringify(body.workspace));
    await saveWorkspace(workspace, identity.id);
    return response({ ok: true, version: workspace.version }, 200, identity.cookie);
  } catch (error) {
    return response({ error: 'INVALID_WORKSPACE', message: error instanceof Error ? error.message : 'Workspace snapshot was rejected.' }, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const identity = storageIdentity(request);
    await deleteWorkspace(identity.id);
    return response({ ok: true }, 200, identity.cookie);
  } catch (error) {
    return response({ error: 'WORKSPACE_DELETE_FAILED', message: error instanceof Error ? error.message : 'Unable to delete workspace.' }, 500);
  }
}
