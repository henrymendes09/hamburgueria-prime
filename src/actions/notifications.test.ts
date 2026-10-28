import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn(), count: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { orderNotification: { updateMany: mocks.update, count: mocks.count, findMany: mocks.findMany } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/order-notifications", () => ({ deliverOrderEmails: vi.fn() }));
import { readVisibleOrderNotifications, readOrderNotifications } from "./notifications";
import { GET } from "@/app/api/notifications/route";
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { id: "customer", restaurantId: "store" } }); mocks.update.mockResolvedValue({ count: 2 }); mocks.count.mockResolvedValue(1); mocks.findMany.mockResolvedValue([]); });
it("keeps feed and individual read state scoped to the account and restaurant", async () => {
  const response = await GET(); expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.count).toHaveBeenCalledWith({ where: { userId: "customer", restaurantId: "store", read: false } });
  await readOrderNotifications("foreign");
  expect(mocks.update).toHaveBeenCalledWith({ where: { userId: "customer", restaurantId: "store", id: "foreign" }, data: { read: true } });
});
it("marks only displayed unread IDs within the authenticated account and restaurant", async () => {
  expect(await readVisibleOrderNotifications(["first", "second", "first"])).toEqual({ success: true, readCount: 2 });
  expect(mocks.update).toHaveBeenCalledWith({ where: { userId: "customer", restaurantId: "store", id: { in: ["first", "second"] }, read: false }, data: { read: true } });
});
it.each([{ ids: [] }, { ids: [""] }, { ids: Array.from({ length: 101 }, () => "id") }])("rejects invalid batches without marking other notifications", async ({ ids }) => {
  expect((await readVisibleOrderNotifications(ids)).success).toBe(false); expect(mocks.update).not.toHaveBeenCalled();
});
it.each([null, { user: { id: "customer", restaurantId: "store", blocked: true } }, { user: { id: "customer" } }])("rejects unauthorized sessions", async session => {
  mocks.auth.mockResolvedValue(session);
  expect((await GET()).status).toBe(401); expect((await readOrderNotifications()).success).toBe(false);
  expect((await readVisibleOrderNotifications(["id"])).success).toBe(false); expect(mocks.update).not.toHaveBeenCalled();
});
