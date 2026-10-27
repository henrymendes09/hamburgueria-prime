import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncOrderPayment } from "@/lib/mercado-pago-payments";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  let order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, restaurantId: session.user.restaurantId ?? undefined },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      updatedAt: true,
      deliveredAt: true,
      entregador: { select: { name: true, phone: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  // Reconcile pending Pix even if a provider webhook was delayed or missed.
  if (order.paymentStatus === "PENDENTE") {
    const limited = await rateLimit(`payment-sync:${id}`, { limit: 1, windowMs: 15000 });
    if (limited.success) {
      const payment = await prisma.order.findUnique({ where: { id }, select: { paymentExternalId: true, paymentMethod: true } });
      if (payment?.paymentMethod === "PIX" && payment.paymentExternalId) {
        try {
          await syncOrderPayment(payment.paymentExternalId);
          const latest = await prisma.order.findUnique({ where: { id }, select: { paymentStatus: true } });
          if (latest) order = { ...order, paymentStatus: latest.paymentStatus };
        } catch { console.error("payment_reconciliation_failed", { orderId: id }); }
      }
    }
  }

  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
