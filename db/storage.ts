import { env } from 'cloudflare:workers';
import type { FoundryWorkspace } from '../src/domain/types';
import { decodeWorkspaceSnapshot, encodeWorkspaceSnapshot } from '../src/persistence/workspace-snapshot';

let schemaReady: Promise<void> | undefined;

function dbBinding() {
  if (!env.DB) throw new Error('D1 binding DB is unavailable.');
  return env.DB;
}

function fileBinding() {
  if (!env.FILES) throw new Error('R2 binding FILES is unavailable.');
  return env.FILES;
}

export async function ensureStorage() {
  if (!schemaReady) {
    const db = dbBinding();
    schemaReady = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS foundry_workspaces (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        stage TEXT NOT NULL,
        version INTEGER NOT NULL,
        snapshot TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS uploaded_files (
        id TEXT PRIMARY KEY NOT NULL,
        workspace_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        r2_key TEXT NOT NULL UNIQUE,
        uploaded_at TEXT NOT NULL
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_uploaded_files_workspace_id ON uploaded_files(workspace_id)'),
    ]).then(() => undefined).catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

export async function loadWorkspace(id: string) {
  await ensureStorage();
  const db = dbBinding();
  const row = await db.prepare('SELECT snapshot FROM foundry_workspaces WHERE id = ? LIMIT 1')
    .bind(id)
    .first<{ snapshot: string }>();
  return row ? decodeWorkspaceSnapshot(row.snapshot) : undefined;
}

export async function saveWorkspace(workspace: FoundryWorkspace, storageId = workspace.id) {
  await ensureStorage();
  const db = dbBinding();
  const snapshot = encodeWorkspaceSnapshot(workspace);
  await db.prepare(`INSERT INTO foundry_workspaces (id, title, stage, version, snapshot, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      stage = excluded.stage,
      version = excluded.version,
      snapshot = excluded.snapshot,
      updated_at = excluded.updated_at
    WHERE excluded.version >= foundry_workspaces.version`)
    .bind(storageId, workspace.title, workspace.stage, workspace.version, snapshot, workspace.createdAt, workspace.updatedAt)
    .run();
}

export async function deleteWorkspace(id: string) {
  await ensureStorage();
  const db = dbBinding();
  await db.prepare('DELETE FROM foundry_workspaces WHERE id = ?').bind(id).run();
}

export interface UploadedFileRecord {
  id: string;
  workspaceId: string;
  filename: string;
  contentType: string;
  byteSize: number;
  r2Key: string;
  uploadedAt: string;
}

export async function storeUpload(record: UploadedFileRecord, bytes: ArrayBuffer) {
  await ensureStorage();
  const db = dbBinding();
  const files = fileBinding();
  await files.put(record.r2Key, bytes, {
    httpMetadata: { contentType: record.contentType },
    customMetadata: { workspaceId: record.workspaceId, originalFilename: record.filename },
  });
  try {
    await db.prepare(`INSERT INTO uploaded_files
      (id, workspace_id, filename, content_type, byte_size, r2_key, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(record.id, record.workspaceId, record.filename, record.contentType, record.byteSize, record.r2Key, record.uploadedAt)
      .run();
  } catch (error) {
    await files.delete(record.r2Key);
    throw error;
  }
}
