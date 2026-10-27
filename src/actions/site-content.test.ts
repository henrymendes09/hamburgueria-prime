import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn(), create: vi.fn(), deleteMany: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/audit", () => ({ audited: async (_session: unknown, work: (tx: unknown) => unknown) => work((await import("@/lib/prisma")).prisma) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { restaurant: { update: m.update }, card: { create: m.create, deleteMany: m.deleteMany } } }));
import { saveSiteContentAction } from "./site-content";
import { addCardAction, deleteCardAction } from "./cards";
import { resolveSiteContent, siteContentSchema } from "@/lib/site-content";
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ user: { id: "user", role: "ADMIN", restaurantId: "own" } }); });
it("saves editable content only for the authenticated restaurant, including an empty FAQ list", async () => {
  const content = { ...resolveSiteContent({ name: "Loja" }), faqs: [] };
  expect((await saveSiteContentAction({ ...content, restaurantId: "foreign" })).success).toBe(true);
  expect(m.update).toHaveBeenCalledWith({ where: { id: "own" }, data: { siteContent: content } });
  expect(resolveSiteContent({ name: "Loja", siteContent: content }).faqs).toEqual([]);
});
it.each([null, { id: "client", role: "CLIENTE", restaurantId: "own" }, { id: "admin", role: "ADMIN", restaurantId: "own", blocked: true }])("denies unauthorized content changes: %j", async user => {
  m.auth.mockResolvedValue(user ? { user } : null);
  expect((await saveSiteContentAction(resolveSiteContent({ name: "Loja" }))).success).toBe(false);
  expect(m.update).not.toHaveBeenCalled();
});
it("rejects unsafe image sources and excessive FAQ content", () => {
  const content = resolveSiteContent({ name: "Loja" });
  for (const image of ["javascript:alert(1)", "//evil.test/image", "https://127.0.0.1/private"]) expect(siteContentSchema.safeParse({ ...content, image }).success).toBe(false);
  expect(siteContentSchema.safeParse({ ...content, faqs: Array(51).fill({ q: "Pergunta", a: "Resposta" }) }).success).toBe(false);
});
it("never accepts a complete card number or CVV, even from an outdated browser", async () => {
  const reference = { brand: "VISA", holderName: "Teste", last4: "1234", expMonth: 12, expYear: new Date().getFullYear() + 1 };
  expect((await addCardAction({ ...reference, number: "4111111111111111", cvv: "123" })).success).toBe(false);
  expect(m.create).not.toHaveBeenCalled();
  expect((await addCardAction(reference)).success).toBe(false);
  expect(m.create).not.toHaveBeenCalled();
  await deleteCardAction("foreign-card");
  expect(m.deleteMany).toHaveBeenCalledWith({ where: { id: "foreign-card", userId: "user" } });
});
