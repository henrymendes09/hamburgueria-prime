import { Prisma } from "@prisma/client";
import { put, get, list, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { encryptBackup, decryptBackup } from "@/lib/backup-crypto";

// Ephemeral credentials must not become valid again after a restore.
const EXCLUDED = new Set(["SecurityRateLimit", "Session", "VerificationToken", "PasswordResetToken"]);
export const backupModels = Prisma.dmmf.datamodel.models.filter(model => !EXCLUDED.has(model.name));

async function backupMedia(token: string, secret: string) {
  const sourceToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!sourceToken) throw new Error("media_backup_not_configured");
  const manifest: { source: string; originalPath: string; backupPath: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ token: sourceToken, prefix: "restaurants/", cursor });
    for (const source of page.blobs) {
      const backupPath = `media/${source.pathname}.hpb`;
      const existing = await get(backupPath, { access: "private", token });
      if (existing?.statusCode === 200) {
        await existing.stream.cancel();
      } else {
        const response = await fetch(source.url, { signal: AbortSignal.timeout(20000), cache: "no-store" });
        if (!response.ok || source.size > 16 * 1024 * 1024) throw new Error("media_backup_read_failed");
        const image = Buffer.from(await response.arrayBuffer());
        const stored = await put(backupPath, encryptBackup(image, secret), { access: "private", token, addRandomSuffix: false });
        const verification = await get(stored.url, { access: "private", token, useCache: false });
        if (!verification || verification.statusCode !== 200 || !decryptBackup(Buffer.from(await new Response(verification.stream).arrayBuffer()), secret).equals(image)) throw new Error("media_backup_integrity_failed");
      }
      manifest.push({ source: source.url, originalPath: source.pathname, backupPath });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return manifest;
}

export async function createDatabaseBackup() {
  const token = process.env.BACKUP_READ_WRITE_TOKEN;
  const secret = process.env.BACKUP_ENCRYPTION_KEY;
  if (!token || !secret) throw new Error("backup_not_configured");
  const tables = await prisma.$transaction(async tx => {
    const result: Record<string, unknown[]> = {};
    for (const model of backupModels) {
      const name = model.dbName ?? model.name;
      const rows = await tx.$queryRawUnsafe<{ rows: unknown[] }[]>(
        `SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) AS rows FROM "${name.replaceAll('"', '""')}" t`,
      );
      result[model.name] = rows[0].rows;
    }
    return result;
  }, { isolationLevel: "RepeatableRead", timeout: 60000, maxWait: 10000 });
  const createdAt = new Date().toISOString();
  const media = await backupMedia(token, secret);
  const payload = Buffer.from(JSON.stringify({ version: 1, createdAt, commit: process.env.VERCEL_GIT_COMMIT_SHA, tables, media }));
  const encrypted = encryptBackup(payload, secret);
  const blob = await put(`database/${createdAt.replaceAll(":", "-")}.hpb`, encrypted, {
    access: "private", token, addRandomSuffix: false, contentType: "application/octet-stream",
  });
  // Verify the stored object before reporting success or expiring older backups.
  const stored = await get(blob.url, { access: "private", token, useCache: false });
  if (!stored || stored.statusCode !== 200) throw new Error("backup_readback_failed");
  const downloaded = Buffer.from(await new Response(stored.stream).arrayBuffer());
  if (!decryptBackup(downloaded, secret).equals(payload)) throw new Error("backup_integrity_failed");
  const cutoff = Date.now() - 30 * 86400000;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "database/", token, cursor });
    const expired = page.blobs.filter(item => item.uploadedAt.getTime() < cutoff && item.url !== blob.url);
    if (expired.length) await del(expired.map(item => item.url), { token });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return { createdAt, tables: Object.keys(tables).length, rows: Object.values(tables).reduce((sum, rows) => sum + rows.length, 0), images: media.length };
}
