import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function validSignature(request: NextRequest, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(signature.split(",").map(part => part.split("=").map(v => v.trim())));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { type?: string; data?: { id?: string } } | null;
  const id = String(body?.data?.id || request.nextUrl.searchParams.get("data.id") || "");
  if (!id || !validSignature(request, id)) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: true });

  if (body?.type === "subscription_preapproval") {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) {
      const data = await response.json() as { external_reference?: string; status?: string; next_payment_date?: string };
      const status = data.status === "authorized" ? "ACTIVE" : data.status === "cancelled" || data.status === "canceled" ? "CANCELED" : data.status === "paused" ? "PAST_DUE" : "PENDING";
      await prisma.subscription.updateMany({ where: { OR: [{ id: data.external_reference }, { providerSubscriptionId: id }] }, data: { status, currentPeriodEnd: data.next_payment_date ? new Date(data.next_payment_date) : undefined } });
    }
  }
  return NextResponse.json({ ok: true });
}
