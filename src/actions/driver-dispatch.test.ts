import { beforeEach, it, expect, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  audit: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  logs: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/audit", () => ({ audited: m.audit }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/order-notifications", () => ({ deliverOrderEmails: vi.fn() }));
vi.mock("@/lib/order-events", () => ({ emitOrderEvent: vi.fn() }));
import { dispatchDriverOrders } from "./driver-dispatch";
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({
    user: { id: "driver", role: "ENTREGADOR", restaurantId: "store" },
  });
  m.audit.mockImplementation(async (_s, work) =>
    work({
      order: { findMany: m.find, updateMany: m.update },
      orderStatusLog: { createMany: m.logs },
    }),
  );
});
it("dispatches all selected preparation orders atomically and preserves already dispatched ones", async () => {
  m.find.mockResolvedValue([
    { id: "a", status: "PREPARANDO" },
    { id: "b", status: "PREPARANDO" },
    { id: "c", status: "SAIU_PARA_ENTREGA" },
  ]);
  m.update.mockResolvedValue({ count: 2 });
  const result = await dispatchDriverOrders(["a", "b", "c"]);
  expect(result.success).toBe(true);
  expect(result.dispatchedIds).toEqual(["a", "b"]);
  expect(m.update.mock.calls[0][0].where).toEqual({
    id: { in: ["a", "b"] },
    restaurantId: "store",
    entregadorId: "driver",
    deliveryType: "ENTREGA",
    status: "PREPARANDO",
  });
  expect(m.logs.mock.calls[0][0].data).toHaveLength(2);
});
it("rejects entire selection when one order is unavailable or foreign", async () => {
  m.find.mockResolvedValue([{ id: "a", status: "PREPARANDO" }]);
  expect((await dispatchDriverOrders(["a", "foreign"])).success).toBe(false);
  expect(m.update).not.toHaveBeenCalled();
  expect(m.find.mock.calls[0][0].where).toMatchObject({
    restaurantId: "store",
    entregadorId: "driver",
    deliveryType: "ENTREGA",
  });
});
it("fails when concurrent assignment changes prevent dispatching the whole selection", async () => {
  m.find.mockResolvedValue([
    { id: "a", status: "PREPARANDO" },
    { id: "b", status: "PREPARANDO" },
  ]);
  m.update.mockResolvedValue({ count: 1 });
  expect((await dispatchDriverOrders(["a", "b"])).success).toBe(false);
  expect(m.logs).not.toHaveBeenCalled();
});
it("rejects blocked drivers and duplicate selections before querying", async () => {
  expect((await dispatchDriverOrders(["a", "a"])).success).toBe(false);
  m.auth.mockResolvedValue({
    user: { id: "d", role: "ENTREGADOR", blocked: true, restaurantId: "store" },
  });
  expect((await dispatchDriverOrders(["a"])).success).toBe(false);
  expect(m.audit).not.toHaveBeenCalled();
});
