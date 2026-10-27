import { timingSafeEqual } from "node:crypto";
import { list } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { paymentRequest } from "@/lib/mercado-pago-payments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : "";
  const actual = request.headers.get("authorization") ?? "";
  if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let database = false, backupRecent = false, paymentCredentialsValid = false;
  try { await prisma.$queryRaw`SELECT 1`; database = true; } catch { /* Report without credentials or database errors. */ }
  try {
    const backups = await list({ token: process.env.BACKUP_READ_WRITE_TOKEN, prefix: "database/", limit: 1000 });
    backupRecent = backups.blobs.some(item => Date.now() - item.uploadedAt.getTime() < 36 * 3600000);
  } catch { /* Unavailable backup storage. */ }
  try { await paymentRequest("/users/me"); paymentCredentialsValid = true; } catch { /* Invalid/missing provider credentials. */ }
  const checks = { database, backupRecent, imageStorageConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    paymentCredentialsValid, paymentWebhookConfigured: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET),
    emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) };
  return Response.json(checks, { headers: { "Cache-Control": "no-store" } });
}
