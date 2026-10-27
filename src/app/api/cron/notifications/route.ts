import { timingSafeEqual } from "node:crypto";
import { deliverOrderEmails } from "@/lib/order-notifications";
export const maxDuration = 60;
export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`, actual = request.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await deliverOrderEmails(); return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
