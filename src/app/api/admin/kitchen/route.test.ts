import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), orders: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/kitchen-server", () => ({ getKitchenOrders: mocks.orders }));
import { GET } from "./route";
beforeEach(() => vi.resetAllMocks());
it.each([null, { user: { id: "u", role: "CLIENTE", restaurantId: "store" } }, { user: { id: "u", role: "ADMIN", restaurantId: "store", blocked: true } }, { user: { id: "u", role: "ADMIN" } }])("rejects unauthorized sessions before querying kitchen data", async session => {
  mocks.auth.mockResolvedValue(session);
  expect((await GET()).status).toBe(401);
  expect(mocks.orders).not.toHaveBeenCalled();
});
it("uses only the authenticated administrator's restaurant and disables caching", async () => {
  mocks.auth.mockResolvedValue({ user: { id: "admin", role: "ADMIN", restaurantId: "own-store" } });
  mocks.orders.mockResolvedValue([{ id: "order" }]);
  const response = await GET();
  expect(mocks.orders).toHaveBeenCalledWith("own-store");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({ orders: [{ id: "order" }] });
});
