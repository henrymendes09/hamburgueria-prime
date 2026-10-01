import { verifyWebhook } from "@/lib/webhook-security";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function validSignature(request: NextRequest, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  return verifyWebhook(signature, requestId, dataId, secret);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { type?: string; data?: { id?: string } } | null;
  const id = String(request.nextUrl.searchParams.get("data.id") || body?.data?.id || "");
  if (!id || !validSignature(request, id)) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: true });

  if (body?.type === "subscription_preapproval") {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) {
      const data = await response.json() as { external_reference?: string; status?: string; next_payment_date?: string };
      const status = data.status === "authorized" ? "ACTIVE" : data.status === "cancelled" || data.status === "canceled" ? "CANCELED" : data.status === "paused" ? "PAST_DUE" : "PENDING";
      // Match only an already linked provider subscription; never use an optional external reference as an unbounded filter.
      await prisma.subscription.updateMany({ where: { providerSubscriptionId: id }, data: { status, currentPeriodEnd: data.next_payment_date ? new Date(data.next_payment_date) : undefined } });
    }
  }
  return NextResponse.json({ ok: true });
}
