import { beforeEach, expect, it, vi } from "vitest";
const { auth, load } = vi.hoisted(() => ({ auth: vi.fn(), load: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/financial-export", () => ({ loadFinancialExport: load }));
import { GET } from "./route";
beforeEach(() => { vi.clearAllMocks(); });
it("denies guest and customer access before reading report data", async () => {
  for (const session of [null, { user: { id: "customer", role: "CLIENTE", restaurantId: "store" } }, { user: { id: "admin", role: "ADMIN", restaurantId: "store", blocked: true } }]) {
    auth.mockResolvedValue(session);
    expect((await GET(new Request("https://site/api/admin/financeiro/export"))).status).toBe(401);
  }
  expect(load).not.toHaveBeenCalled();
});
it("rejects invalid periods and formats before querying the database", async () => {
  auth.mockResolvedValue({ user: { id: "admin", role: "ADMIN", restaurantId: "own-store" } });
  for (const query of ["de=2026-10-30&ate=2026-10-01", "formato=html"]) expect((await GET(new Request("https://site/api/admin/financeiro/export?" + query))).status).toBe(400);
  expect(load).not.toHaveBeenCalled();
});
