import { expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { encryptBackup, decryptBackup } from "./backup-crypto";

it("restores compressed encrypted data and rejects wrong keys and tampering", () => {
  const key = randomBytes(32).toString("base64");
  const data = Buffer.from(JSON.stringify({ private: "never public", rows: [1, 2, 3] }));
  const encrypted = encryptBackup(data, key);
  expect(encrypted.includes(Buffer.from("never public"))).toBe(false);
  expect(decryptBackup(encrypted, key)).toEqual(data);
  expect(() => decryptBackup(encrypted, randomBytes(32).toString("base64"))).toThrow();
  encrypted[encrypted.length - 1] ^= 1;
  expect(() => decryptBackup(encrypted, key)).toThrow();
});
