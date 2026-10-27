import { timingSafeEqual } from "node:crypto";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.MONITORING_SECRET ? `Bearer ${process.env.MONITORING_SECRET}` : "";
  const actual = request.headers.get("authorization") ?? "";
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(actual) || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return Response.json({ status: "unauthorized" }, { status: 401 });
  }
  try {
    if (!process.env.BACKUP_READ_WRITE_TOKEN) throw new Error("backup_not_configured");
    const page = await list({ token: process.env.BACKUP_READ_WRITE_TOKEN, prefix: "database/", limit: 1000 });
    const recent = page.blobs.some(blob => Date.now() - blob.uploadedAt.getTime() < 36 * 3600000);
    return Response.json({ status: recent ? "ok" : "stale" }, { status: recent ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
