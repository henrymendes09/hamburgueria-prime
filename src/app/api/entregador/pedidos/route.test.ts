import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), orders: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/driver-server", () => ({ getDriverOrders: m.orders }));
import { GET } from "./route";
beforeEach(() => vi.resetAllMocks());
it.each([
  null,
  { user: { id: "x", role: "CLIENTE", restaurantId: "store" } },
  {
    user: { id: "x", role: "ENTREGADOR", restaurantId: "store", blocked: true },
  },
  { user: { id: "x", role: "ENTREGADOR" } },
])("denies unauthorized driver feeds", async (session) => {
  m.auth.mockResolvedValue(session);
  expect((await GET()).status).toBe(401);
  expect(m.orders).not.toHaveBeenCalled();
});
it("loads only the authenticated driver and restaurant without public caching", async () => {
  m.auth.mockResolvedValue({
    user: { id: "own-driver", role: "ENTREGADOR", restaurantId: "own-store" },
  });
  m.orders.mockResolvedValue([]);
  const response = await GET();
  expect(m.orders).toHaveBeenCalledWith("own-store", "own-driver");
  expect(response.headers.get("cache-control")).toContain("private, no-store");
});
