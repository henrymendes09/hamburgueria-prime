import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), updateMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { contactMessage: { updateMany: mocks.updateMany, count: mocks.count, findFirst: mocks.findFirst, findMany: mocks.findMany }, $transaction: mocks.transaction } }));
import { markContactMessageRead } from "./admin-messages";
import { GET } from "@/app/api/admin/messages/route";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "admin", role: "ADMIN", restaurantId: "own", blocked: false } });
});
it.each([null, { id: "client", role: "CLIENTE", restaurantId: "own" }, { id: "admin", role: "ADMIN", blocked: true, restaurantId: "own" }, { id: "admin", role: "ADMIN" }])("denies inbox and mutations to unauthorized users: %j", async user => {
  mocks.auth.mockResolvedValue(user ? { user } : null);
  expect((await GET(new Request("https://example.com/api/admin/messages?view=list"))).status).toBe(401);
  expect((await markContactMessageRead("message")).success).toBe(false);
  expect(mocks.updateMany).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("does not allow marking another restaurant's messages read", async () => {
  mocks.updateMany.mockResolvedValue({ count: 0 });
  expect((await markContactMessageRead("foreign-message")).success).toBe(false);
  expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: "foreign-message", restaurantId: "own" }, data: { read: true } });
});
it("returns only unread counts and identifiers in notifications", async () => {
  mocks.count.mockResolvedValue(2); mocks.findFirst.mockResolvedValue({ id: "message" });
  const response = await GET(new Request("https://example.com/api/admin/messages?restaurantId=foreign"));
  expect(await response.json()).toEqual({ unread: 2, latestId: "message" });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.count).toHaveBeenCalledWith({ where: { restaurantId: "own", read: false } });
});
it("bounds inbox pages and applies the administrator's restaurant and unread filter", async () => {
  mocks.transaction.mockResolvedValue([[], 0]);
  const response = await GET(new Request("https://example.com/api/admin/messages?view=list&filter=unread&page=NaN&restaurantId=foreign"));
  expect(await response.json()).toEqual({ messages: [], count: 0, page: 1 });
  expect(mocks.findMany.mock.calls[0][0]).toMatchObject({ where: { restaurantId: "own", read: false }, skip: 0, take: 20 });
});
