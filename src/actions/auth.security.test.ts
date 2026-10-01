import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.findUnique, update: mocks.update }, passwordResetToken: { create: mocks.create } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => ({ success: true }), clientIp: () => "test" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/tenant", () => ({ getPublicRestaurant: vi.fn() }));
import { forgotPasswordAction, resetPasswordAction } from "./auth";
beforeEach(() => vi.clearAllMocks());
it("never issues a public reset token or reveals whether an account exists", async () => {
  const existing = await forgotPasswordAction({ email: "existing@example.invalid" });
  const unknown = await forgotPasswordAction({ email: "unknown@example.invalid" });
  expect(existing).toEqual(unknown);
  expect(existing).not.toHaveProperty("devToken");
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.findUnique).not.toHaveBeenCalled();
});
it("rejects previously exposed reset tokens without changing a password", async () => {
  const result = await resetPasswordAction({ token: "a".repeat(64), password: "new-test-password", confirmPassword: "new-test-password" });
  expect(result.success).toBe(false);
  expect(mocks.update).not.toHaveBeenCalled();
});
