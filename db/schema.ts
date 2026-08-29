import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const foundryWorkspaces = sqliteTable('foundry_workspaces', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  stage: text('stage').notNull(),
  version: integer('version').notNull(),
  snapshot: text('snapshot').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const uploadedFiles = sqliteTable('uploaded_files', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  r2Key: text('r2_key').notNull().unique(),
  uploadedAt: text('uploaded_at').notNull(),
}, (table) => [index('idx_uploaded_files_workspace_id').on(table.workspaceId)]);
