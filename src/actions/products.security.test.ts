import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), categoryUpdate: vi.fn(), addonUpdate: vi.fn(), categoryFind: vi.fn(), addonCount: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { category: { updateMany: m.categoryUpdate, findFirst: m.categoryFind }, addon: { updateMany: m.addonUpdate, count: m.addonCount }, $transaction: m.transaction } }));
import { upsertCategoryAction, upsertAddonAction, upsertProductAction } from "./products";
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ user: { id: "admin", role: "ADMIN", restaurantId: "own", blocked: false } }); });
it("scopes category and addon mutations to the administrator's tenant", async () => {
  m.categoryUpdate.mockResolvedValue({ count: 0 }); m.addonUpdate.mockResolvedValue({ count: 0 });
  expect((await upsertCategoryAction("foreign", { name: "Test", icon: "icon" })).success).toBe(false);
  expect(m.categoryUpdate.mock.calls[0][0].where).toEqual({ id: "foreign", restaurantId: "own" });
  expect((await upsertAddonAction("foreign", { name: "Test", price: 1, type: "EXTRA" })).success).toBe(false);
  expect(m.addonUpdate.mock.calls[0][0].where).toEqual({ id: "foreign", restaurantId: "own" });
});
it("rejects foreign category or addon references before starting product mutations", async () => {
  const input = { name: "Test", description: "Test product", ingredients: "Test", image: "/image.png", price: 10, categoryId: "category", addonIds: ["foreign"] };
  m.categoryFind.mockResolvedValue(null);
  expect((await upsertProductAction(null, input)).success).toBe(false);
  m.categoryFind.mockResolvedValue({ id: "category" }); m.addonCount.mockResolvedValue(0);
  expect((await upsertProductAction(null, input)).success).toBe(false);
  expect(m.transaction).not.toHaveBeenCalled();
});
it("denies blocked administrators", async () => {
  m.auth.mockResolvedValue({ user: { id: "admin", role: "ADMIN", restaurantId: "own", blocked: true } });
  await expect(upsertCategoryAction("id", { name: "Test", icon: "icon" })).rejects.toThrow();
  expect(m.categoryUpdate).not.toHaveBeenCalled();
});
