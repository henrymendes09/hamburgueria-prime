import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: mocks.query, $executeRaw: mocks.execute } }));
import { clientIp, rateLimit } from "./rate-limit";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it("enforces a shared database limit in production without storing the raw identity", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(Math, "random").mockReturnValue(1);
  mocks.query.mockResolvedValueOnce([{ count: 1 }]).mockResolvedValueOnce([{ count: 3 }]);
  expect((await rateLimit("test-user@example.invalid", { limit: 2, windowMs: 60000 })).success).toBe(true);
  expect((await rateLimit("test-user@example.invalid", { limit: 2, windowMs: 60000 })).success).toBe(false);
  expect(mocks.query.mock.calls[0]).not.toContain("test-user@example.invalid");
});
it("denies protected actions when the shared limiter is unavailable", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.query.mockRejectedValueOnce(new Error("database unavailable"));
  expect((await rateLimit("failed", { limit: 2, windowMs: 60000 })).success).toBe(false);
});
it("prefers the platform-provided client IP", () => {
  expect(clientIp(new Headers({ "x-vercel-forwarded-for": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
});
