import { storeUpload } from '../../../db/storage';
import { WORKSPACE_COOKIE_NAME } from '../../../src/persistence/workspace-identity';

export const runtime = 'edge';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const allowedTypes = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/csv',
  'application/json',
  'application/vnd.ms-excel',
]);

function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function safeFilename(filename: string) {
  const cleaned = filename.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 100) || 'source-document';
}

function storageWorkspaceId(request: Request) {
  const existing = request.headers.get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${WORKSPACE_COOKIE_NAME}=`))
    ?.slice(`${WORKSPACE_COOKIE_NAME}=`.length);
  return existing && /^workspace-[a-f0-9-]{36}$/.test(existing)
    ? existing
    : `workspace-unclaimed-${crypto.randomUUID()}`;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const workspaceId = storageWorkspaceId(request);
    if (!(file instanceof File)) return response({ error: 'FILE_REQUIRED', message: 'Choose a document to upload.' }, 400);
    if (!allowedTypes.has(file.type)) return response({ error: 'UNSUPPORTED_FILE_TYPE', message: 'Upload PDF, TXT, CSV, or JSON evidence only.' }, 415);
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return response({ error: 'INVALID_FILE_SIZE', message: 'Uploads must be between 1 byte and 10 MB.' }, 413);

    const id = crypto.randomUUID();
    const filename = safeFilename(file.name);
    const r2Key = `${workspaceId}/${id}-${filename}`;
    const bytes = await file.arrayBuffer();
    const record = {
      id,
      workspaceId,
      filename,
      contentType: file.type,
      byteSize: file.size,
      r2Key,
      uploadedAt: new Date().toISOString(),
    };
    await storeUpload(record, bytes);

    const textLike = file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/csv';
    const excerpt = textLike ? new TextDecoder().decode(bytes.slice(0, 24_000)) : undefined;
    return response({
      ok: true,
      file: {
        id,
        filename,
        content_type: file.type,
        byte_size: file.size,
        document_url: `document://r2/${encodeURIComponent(r2Key)}`,
        retrieval_status: textLike ? 'available' : 'metadata_only',
        excerpt,
      },
    }, 201);
  } catch (error) {
    return response({ error: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'The upload could not be stored.' }, 500);
  }
}
