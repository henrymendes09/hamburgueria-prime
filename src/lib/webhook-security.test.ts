import { expect, it } from "vitest";
import crypto from "node:crypto";
import { verifyWebhook } from "./webhook-security";
const now = 1790876617000;
const ts = String(Math.floor(now / 1000));
const secret = "test-only-secret";
const hash = crypto.createHmac("sha256", secret).update(`id:123;request-id:request-1;ts:${ts};`).digest("hex");
it("accepts a valid recent signed notification", () => expect(verifyWebhook(`ts=${ts},v1=${hash}`, "request-1", "123", secret, now)).toBe(true));
it("rejects malformed signatures without throwing, stale messages and tampering", () => {
  for (const signature of ["", `ts=${ts},v1=x`, `ts=${ts},v1=${"f".repeat(64)}`, `ts=${ts},v1=${hash},ts=${ts}`]) expect(verifyWebhook(signature, "request-1", "123", secret, now)).toBe(false);
  expect(verifyWebhook(`ts=${ts},v1=${hash}`, "request-1", "123", secret, now + 601000)).toBe(false);
  expect(verifyWebhook(`ts=${ts},v1=${hash}`, "request-1", "456", secret, now)).toBe(false);
});
