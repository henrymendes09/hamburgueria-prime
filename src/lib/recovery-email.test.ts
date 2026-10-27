import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ create: vi.fn(), send: vi.fn(), close: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: mock.create } }));
import { emailIsConfigured, sendPasswordResetEmail } from "./recovery-email";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GMAIL_USER", "sender@gmail.com");
  vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
  vi.stubEnv("NEXTAUTH_URL", "https://hamburgueria-prime.vercel.app");
  mock.create.mockReturnValue({ sendMail: mock.send, close: mock.close });
  mock.send.mockResolvedValue({ accepted: ["recipient@example.invalid"] });
});
afterEach(() => vi.unstubAllEnvs());
it("sends through authenticated TLS and includes only the canonical reset URL", async () => {
  await sendPasswordResetEmail("recipient@example.invalid", `v2.${"a".repeat(64)}`);
  expect(mock.create).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: "sender@gmail.com", pass: "abcdefghijklmnop" }, disableFileAccess: true, disableUrlAccess: true }));
  expect(mock.send).toHaveBeenCalledWith(expect.objectContaining({ to: "recipient@example.invalid", text: expect.stringContaining("https://hamburgueria-prime.vercel.app/redefinir-senha?token=v2.") }));
  expect(mock.close).toHaveBeenCalledOnce();
});
it("rejects missing credentials and unaccepted deliveries", async () => {
  vi.stubEnv("GMAIL_APP_PASSWORD", "");
  expect(emailIsConfigured()).toBe(false);
  await expect(sendPasswordResetEmail("recipient@example.invalid", "token")).rejects.toThrow("email_not_configured");
  vi.stubEnv("GMAIL_APP_PASSWORD", "abcdefghijklmnop");
  mock.send.mockResolvedValue({ accepted: [] });
  await expect(sendPasswordResetEmail("recipient@example.invalid", "token")).rejects.toThrow("email_not_accepted");
  expect(mock.close).toHaveBeenCalledOnce();
});
