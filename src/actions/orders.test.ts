import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), audited: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findFirst: mocks.find } } }));
vi.mock("@/lib/audit", () => ({ audited: mocks.audited }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/order-notifications", () => ({ deliverOrderEmails: vi.fn() }));
vi.mock("@/lib/order-events", () => ({ emitOrderEvent: vi.fn() }));
vi.mock("@/lib/mercado-pago-payments", () => ({ cancelOrRefundPayment: vi.fn() }));
import { updateOrderStatusAction } from "./orders";
const order = { id: "order", restaurantId: "store", status: "PREPARANDO", deliveryType: "RETIRADA", paymentMethod: "DINHEIRO", paymentStatus: "PENDENTE", acceptedAt: new Date(), deliveredAt: null };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "admin", role: "ADMIN", restaurantId: "store" } });
  mocks.find.mockResolvedValue(order);
  mocks.audited.mockImplementation(async (_session, work) => work({ order: { update: mocks.update } }));
});
it("completes pickup directly from preparation and records delivery payment with an audit", async () => {
  expect((await updateOrderStatusAction("order", "ENTREGUE")).success).toBe(true);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "order", restaurantId: "store", status: "PREPARANDO" }, data: expect.objectContaining({ status: "ENTREGUE", paymentStatus: "PAGO", deliveredAt: expect.any(Date), statusLog: { create: { status: "ENTREGUE" } } }) }));
});
it("does not skip the dispatch stage for delivery orders", async () => {
  mocks.find.mockResolvedValue({ ...order, deliveryType: "ENTREGA" });
  expect((await updateOrderStatusAction("order", "ENTREGUE")).success).toBe(false);
  expect(mocks.audited).not.toHaveBeenCalled();
});
it("does not modify orders outside the authenticated restaurant", async () => {
  mocks.find.mockResolvedValue(null);
  expect((await updateOrderStatusAction("foreign", "ENTREGUE")).success).toBe(false);
  expect(mocks.find).toHaveBeenCalledWith({ where: { id: "foreign", restaurantId: "store" } });
  expect(mocks.audited).not.toHaveBeenCalled();
});
it("still prevents accepting unconfirmed online Pix payments", async () => {
  mocks.find.mockResolvedValue({ ...order, status: "RECEBIDO", paymentMethod: "PIX" });
  expect((await updateOrderStatusAction("order", "ACEITO")).success).toBe(false);
  expect(mocks.audited).not.toHaveBeenCalled();
});
