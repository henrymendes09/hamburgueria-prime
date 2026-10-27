import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ user: vi.fn(), create: vi.fn(), delete: vi.fn(), token: vi.fn(), update: vi.fn(), transaction: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { hash: async () => "new-hash" } }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mock.user }, passwordResetToken: { findUnique: mock.token, deleteMany: mock.delete }, $transaction: mock.transaction,
} }));
import { consumePasswordReset, issuePasswordReset, resetTokenDigest } from "./password-recovery";
beforeEach(() => {
  vi.clearAllMocks();
  mock.user.mockResolvedValue({ id: "user-1", email: "test@example.invalid", blocked: false, passwordHash: "hash" });
  mock.delete.mockResolvedValue({ count: 1 });
  mock.transaction.mockImplementation(async callback => callback({
    $queryRaw: vi.fn(), user: { findUnique: mock.user, update: mock.update },
    passwordResetToken: { create: mock.create, deleteMany: mock.delete },
  }));
});
it("delivers a random token but only stores its digest with a 30 minute lifetime", async () => {
  const deliver = vi.fn();
  await issuePasswordReset("test@example.invalid", deliver);
  const token = deliver.mock.calls[0][1];
  expect(token).toMatch(/^v2\.[a-f0-9]{64}$/);
  expect(mock.create.mock.calls[0][0].data.token).toBe(resetTokenDigest(token));
  expect(mock.create.mock.calls[0][0].data.token).not.toBe(token);
  expect(mock.create.mock.calls[0][0].data.expires.getTime() - Date.now()).toBeGreaterThan(29 * 60000);
});
it("does not send mail or create tokens for unknown or blocked accounts", async () => {
  const deliver = vi.fn();
  mock.user.mockResolvedValueOnce(null).mockResolvedValueOnce({ blocked: true });
  await issuePasswordReset("unknown@example.invalid", deliver);
  await issuePasswordReset("blocked@example.invalid", deliver);
  expect(deliver).not.toHaveBeenCalled();
  expect(mock.create).not.toHaveBeenCalled();
});
it("rejects legacy and expired reset links", async () => {
  expect(await consumePasswordReset("a".repeat(64), "new-password")).toBe(false);
  expect(mock.token).not.toHaveBeenCalled();
  mock.token.mockResolvedValue({ expires: new Date(0), user: { blocked: false } });
  expect(await consumePasswordReset(`v2.${"a".repeat(64)}`, "new-password")).toBe(false);
  expect(mock.update).not.toHaveBeenCalled();
});
it("only updates the password if the single-use token is atomically consumed", async () => {
  mock.token.mockResolvedValue({ userId: "user-1", expires: new Date(Date.now() + 60000), user: { blocked: false } });
  mock.delete.mockResolvedValueOnce({ count: 0 });
  expect(await consumePasswordReset(`v2.${"a".repeat(64)}`, "new-password")).toBe(false);
  expect(mock.update).not.toHaveBeenCalled();
  expect(await consumePasswordReset(`v2.${"a".repeat(64)}`, "new-password")).toBe(true);
  expect(mock.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { passwordHash: "new-hash" } });
});
