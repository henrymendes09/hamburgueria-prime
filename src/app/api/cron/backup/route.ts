import { timingSafeEqual } from "node:crypto";
import { createDatabaseBackup } from "@/lib/backups";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : "";
  const actual = request.headers.get("authorization") ?? "";
  if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await createDatabaseBackup();
    console.info("database_backup_completed", result);
    return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("database_backup_failed");
    return Response.json({ ok: false }, { status: 503 });
  }
}
