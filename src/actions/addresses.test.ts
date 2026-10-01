import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ find: vi.fn(), updateMany: vi.fn(), update: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "owner", blocked: false } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: async (callback: (tx: unknown) => unknown) => callback({ address: { findFirst: m.find, updateMany: m.updateMany, update: m.update, create: m.create } }) } }));
import { upsertAddressAction } from "./addresses";
const input = { label: "Casa", cep: "01001-000", street: "Rua salva", number: "10", complement: "Apartamento", neighborhood: "Centro", city: "São Paulo", state: "SP", reference: "Portão", isDefault: true };
beforeEach(() => vi.clearAllMocks());
it("rejects a foreign address before changing any defaults", async () => {
  m.find.mockResolvedValue(null);
  expect((await upsertAddressAction("foreign", input)).success).toBe(false);
  expect(m.updateMany).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it("updates the same owned address without duplicating it and invalidates changed coordinates", async () => {
  m.find.mockResolvedValue({ ...input, id: "owned", userId: "owner", latitude: -23, longitude: -46 });
  expect((await upsertAddressAction("owned", { ...input, street: "Nova rua" })).success).toBe(true);
  expect(m.update).toHaveBeenCalledWith({ where: { id: "owned", userId: "owner" }, data: { ...input, street: "Nova rua", latitude: null, longitude: null } });
  expect(m.create).not.toHaveBeenCalled();
});
it("preserves coordinates when editing only the address label", async () => {
  m.find.mockResolvedValue({ ...input, id: "owned", userId: "owner", latitude: -23, longitude: -46 });
  await upsertAddressAction("owned", { ...input, label: "Trabalho" });
  expect(m.update.mock.calls[0][0].data).not.toHaveProperty("latitude");
});
