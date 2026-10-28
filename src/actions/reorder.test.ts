import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), restaurant: vi.fn(), order: vi.fn(), products: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/tenant", () => ({ getPublicRestaurant: mocks.restaurant }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findFirst: mocks.order }, product: { findMany: mocks.products } } }));
import { prepareReorderAction } from "./reorder";
beforeEach(() => vi.resetAllMocks());
it.each([null, { user: { id: "customer", blocked: true } }])("rejects unauthenticated or blocked customers before reading orders", async session => {
  mocks.auth.mockResolvedValue(session);
  expect((await prepareReorderAction("order")).success).toBe(false);
  expect(mocks.order).not.toHaveBeenCalled();
});
it("scopes previous orders to both the owner and selected restaurant", async () => {
  mocks.auth.mockResolvedValue({ user: { id: "customer" } });
  mocks.restaurant.mockResolvedValue({ id: "store" });
  mocks.order.mockResolvedValue(null);
  expect((await prepareReorderAction("another-customers-order")).success).toBe(false);
  expect(mocks.order).toHaveBeenCalledWith({ where: { id: "another-customers-order", userId: "customer", restaurantId: "store" }, select: { items: true } });
  expect(mocks.products).not.toHaveBeenCalled();
});
