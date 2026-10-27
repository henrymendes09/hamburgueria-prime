import { readFileSync } from "node:fs";
import { PrismaClient, Prisma } from "@prisma/client";
import { decryptBackup } from "../src/lib/backup-crypto";

// Restore is deliberately offline and restricted to an EMPTY database.
// Create its schema with `prisma db push` first. Never point this at production.
async function main() {
  const file = process.argv[2];
  if (!file || process.argv[3] !== "--confirm-empty-target" || !process.env.RESTORE_DATABASE_URL || !process.env.BACKUP_ENCRYPTION_KEY) {
    throw new Error("Usage: RESTORE_DATABASE_URL=... BACKUP_ENCRYPTION_KEY=... npx tsx scripts/restore-backup.ts file.hpb --confirm-empty-target");
  }
  const target = new URL(process.env.RESTORE_DATABASE_URL);
  const source = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  if (source && target.hostname === source.hostname && target.pathname === source.pathname) throw new Error("Refusing to restore into the source database");
  const snapshot = JSON.parse(decryptBackup(readFileSync(file), process.env.BACKUP_ENCRYPTION_KEY).toString()) as {
    version: number; tables: Record<string, unknown[]>;
  };
  if (snapshot.version !== 1 || !snapshot.tables || typeof snapshot.tables !== "object") throw new Error("Invalid snapshot");
  const models = Prisma.dmmf.datamodel.models;
  if (Object.keys(snapshot.tables).some(name => !models.some(model => model.name === name))) throw new Error("Schema mismatch");
  const db = new PrismaClient({ datasources: { db: { url: process.env.RESTORE_DATABASE_URL } } });
  try {
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT set_config('app.restore_mode', 'on', true)`;
      // Check every table, including excluded session tables, before writing anything.
      for (const model of models) {
        const name = (model.dbName ?? model.name).replaceAll('"', '""');
        const [result] = await tx.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) FROM "${name}"`);
        if (Number(result.count) !== 0) throw new Error(`Target must be empty: ${model.name}`);
      }
      const pending = models.filter(model => snapshot.tables[model.name]);
      const restored = new Set<string>();
      while (pending.length) {
        const index = pending.findIndex(model => model.fields.every(field =>
          !field.relationFromFields?.length || field.type === model.name || restored.has(field.type) || !snapshot.tables[field.type],
        ));
        if (index < 0) throw new Error("Unsupported relation cycle");
        const [model] = pending.splice(index, 1);
        const name = (model.dbName ?? model.name).replaceAll('"', '""');
        const rows = snapshot.tables[model.name];
        if (rows.length) await tx.$executeRawUnsafe(
          `INSERT INTO "${name}" SELECT * FROM jsonb_populate_recordset(NULL::"${name}", $1::jsonb)`, JSON.stringify(rows),
        );
        const [result] = await tx.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) FROM "${name}"`);
        if (Number(result.count) !== rows.length) throw new Error(`Row count mismatch: ${model.name}`);
        const [difference] = await tx.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT count(*) FROM ((SELECT to_jsonb(t) FROM "${name}" t EXCEPT SELECT value FROM jsonb_array_elements($1::jsonb)) UNION ALL (SELECT value FROM jsonb_array_elements($1::jsonb) EXCEPT SELECT to_jsonb(t) FROM "${name}" t)) differences`, JSON.stringify(rows),
        );
        if (Number(difference.count) !== 0) throw new Error(`Data mismatch: ${model.name}`);
        restored.add(model.name);
      }
      console.log(JSON.stringify({ restoredTables: restored.size, restoredRows: Object.values(snapshot.tables).reduce((sum, rows) => sum + rows.length, 0) }));
    }, { timeout: 120000 });
  } finally { await db.$disconnect(); }
}

main().catch(() => { console.error("Restore failed; transaction rolled back. Check target, key, snapshot and schema compatibility."); process.exitCode = 1; });
