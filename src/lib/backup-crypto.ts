import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";

function key(value: string) {
  const result = Buffer.from(value, "base64");
  if (result.length !== 32) throw new Error("backup_key_invalid");
  return result;
}

export function encryptBackup(data: Buffer, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(gzipSync(data)), cipher.final()]);
  return Buffer.concat([Buffer.from("HPB1"), iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptBackup(data: Buffer, secret: string) {
  if (data.subarray(0, 4).toString() !== "HPB1") throw new Error("backup_format_invalid");
  const decipher = createDecipheriv("aes-256-gcm", key(secret), data.subarray(4, 16));
  decipher.setAuthTag(data.subarray(16, 32));
  return gunzipSync(Buffer.concat([decipher.update(data.subarray(32)), decipher.final()]));
}
