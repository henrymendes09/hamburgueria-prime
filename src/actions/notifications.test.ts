import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), updateMany: vi.fn(), count: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/order-notifications", () => ({ deliverOrderEmails: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { orderNotification: { updateMany: mocks.updateMany, count: mocks.count, findMany: mocks.findMany } } }));
import { readOrderNotifications } from "./notifications";
import { GET } from "@/app/api/notifications/route";
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ user: { id: "customer", restaurantId: "own" } }); mocks.count.mockResolvedValue(1); mocks.findMany.mockResolvedValue([]); });
it("scopes notifications and read state to both account and restaurant", async () => {
  const response = await GET(); expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.count).toHaveBeenCalledWith({ where: { userId: "customer", restaurantId: "own", read: false } });
  await readOrderNotifications("foreign");
  expect(mocks.updateMany).toHaveBeenCalledWith({ where: { userId: "customer", restaurantId: "own", id: "foreign" }, data: { read: true } });
});
it.each([null, { id: "blocked", restaurantId: "own", blocked: true }, { id: "no-tenant" }])("rejects unauthorized notification access: %j", async user => {
  mocks.auth.mockResolvedValue(user ? { user } : null); expect((await GET()).status).toBe(401); expect((await readOrderNotifications()).success).toBe(false); expect(mocks.updateMany).not.toHaveBeenCalled();
});
