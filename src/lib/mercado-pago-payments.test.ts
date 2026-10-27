import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { cancelOrRefundPayment, paymentStatus, validatePayment } from "./mercado-pago-payments";
const order = { id: "order-1", total: 25.5, paymentExternalId: "123" };
const payment = { id: 123, status: "approved", transaction_amount: 25.5, currency_id: "BRL", external_reference: "order-1" };
beforeEach(() => { vi.unstubAllGlobals(); vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "test-only"); });
it("rejects another order, currency, amount or payment ID", () => {
  expect(() => validatePayment(payment, order)).not.toThrow();
  for (const invalid of [{ ...payment, id: 124 }, { ...payment, currency_id: "USD" }, { ...payment, transaction_amount: 0.01 }, { ...payment, external_reference: "other" }]) {
    expect(() => validatePayment(invalid, order)).toThrow();
  }
});
it("maps approved, pending, failed, charged back and refunded states", () => {
  expect(paymentStatus(payment)).toBe("PAGO");
  expect(paymentStatus({ ...payment, status: "pending" })).toBe("PENDENTE");
  expect(paymentStatus({ ...payment, status: "charged_back" })).toBe("FALHOU");
  expect(paymentStatus({ ...payment, status: "refunded" })).toBe("ESTORNADO");
});
it("refunds with a stable idempotency key and verifies final status", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(payment)).mockResolvedValueOnce(Response.json({ id: "refund-1" })).mockResolvedValueOnce(Response.json({ ...payment, status: "refunded" }));
  vi.stubGlobal("fetch", fetch);
  expect(await cancelOrRefundPayment(order)).toBe("ESTORNADO");
  expect(fetch.mock.calls[1][1].headers["X-Idempotency-Key"]).toBe("refund-order-1");
});
it("cancels pending charges and refuses unconfirmed refunds", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ...payment, status: "pending" })).mockResolvedValueOnce(Response.json({ status: "cancelled" })).mockResolvedValueOnce(Response.json({ ...payment, status: "cancelled" }));
  vi.stubGlobal("fetch", fetch);
  expect(await cancelOrRefundPayment(order)).toBe("FALHOU");
  expect(fetch.mock.calls[1][1].method).toBe("PUT");
  fetch.mockReset().mockImplementation(async () => Response.json(payment));
  await expect(cancelOrRefundPayment(order)).rejects.toThrow("payment_settlement_pending");
});
