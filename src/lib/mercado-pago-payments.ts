import { prisma } from "@/lib/prisma";

export type ProviderPayment = {
  id: number | string;
  status: string;
  transaction_amount: number;
  currency_id: string;
  external_reference?: string;
  transaction_amount_refunded?: number;
};

export async function paymentRequest(path: string, init: RequestInit = {}) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || token === "[SENSITIVE]") throw new Error("Pagamento indisponível.");
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`payment_provider_${response.status}`);
  return response.json();
}

export function validatePayment(payment: ProviderPayment, order: { id: string; total: number; paymentExternalId: string | null }) {
  if (String(payment.id) !== order.paymentExternalId || payment.currency_id !== "BRL" ||
      !Number.isFinite(payment.transaction_amount) || Math.round(payment.transaction_amount * 100) !== Math.round(order.total * 100) ||
      (payment.external_reference && payment.external_reference !== order.id)) {
    throw new Error("payment_mismatch");
  }
}

export function paymentStatus(payment: ProviderPayment) {
  // A partial refund must not be presented as a fully paid order.
  if (payment.status === "refunded" || (payment.transaction_amount_refunded ?? 0) > 0) return "ESTORNADO" as const;
  if (payment.status === "approved") return "PAGO" as const;
  if (["rejected", "cancelled", "charged_back"].includes(payment.status)) return "FALHOU" as const;
  return "PENDENTE" as const;
}

export async function syncOrderPayment(id: string) {
  const order = await prisma.order.findFirst({ where: { paymentExternalId: id, paymentMethod: "PIX" } });
  if (!order) return;
  await prisma.$transaction(async tx => {
    // Serialize reads of provider state so delayed webhook handlers cannot overwrite a refund with an old approval.
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${order.id} FOR UPDATE`;
    const current = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
    const payment = await paymentRequest(`/v1/payments/${encodeURIComponent(id)}`) as ProviderPayment;
    validatePayment(payment, current);
    await tx.order.update({ where: { id: order.id, paymentExternalId: id }, data: { paymentStatus: paymentStatus(payment) } });
  }, { timeout: 25000, maxWait: 10000 });
}

export async function cancelOrRefundPayment(order: { id: string; total: number; paymentExternalId: string | null }) {
  if (!order.paymentExternalId) throw new Error("payment_missing");
  const path = `/v1/payments/${encodeURIComponent(order.paymentExternalId)}`;
  const payment = await paymentRequest(path) as ProviderPayment;
  validatePayment(payment, order);
  if (payment.status === "approved") {
    await paymentRequest(`${path}/refunds`, {
      method: "POST",
      headers: { "X-Idempotency-Key": `refund-${order.id}` },
      body: JSON.stringify({}),
    });
  } else if (["pending", "in_process", "authorized"].includes(payment.status)) {
    await paymentRequest(path, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
  } else if (!["refunded", "cancelled", "rejected", "charged_back"].includes(payment.status)) {
    throw new Error("payment_not_cancelable");
  }
  // Read back the result. Do not mark a refund complete on a request acknowledgement alone.
  const final = await paymentRequest(path) as ProviderPayment;
  validatePayment(final, order);
  if (!["refunded", "cancelled", "rejected", "charged_back"].includes(final.status)) throw new Error("payment_settlement_pending");
  return paymentStatus(final);
}
