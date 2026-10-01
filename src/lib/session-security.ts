import crypto from "node:crypto";

export function credentialVersion(passwordHash: string | null, secret: string) {
  return crypto.createHmac("sha256", secret).update(passwordHash ?? "oauth-only").digest("hex");
}

export function isValidSession(tokenVersion: unknown, passwordHash: string | null, secret: string, blocked: boolean) {
  if (blocked || typeof tokenVersion !== "string" || !/^[a-f0-9]{64}$/.test(tokenVersion)) return false;
  const expected = credentialVersion(passwordHash, secret);
  return crypto.timingSafeEqual(Buffer.from(tokenVersion), Buffer.from(expected));
}
