import crypto from "node:crypto";

export function verifyWebhook(signature: string, requestId: string, dataId: string, secret: string, now = Date.now()) {
  if (!secret || signature.length > 256 || !/^[a-zA-Z0-9_-]{1,128}$/.test(requestId) || !/^[a-zA-Z0-9_-]{1,128}$/.test(dataId)) return false;
  const parts = signature.split(",").map(part => part.trim().split("="));
  if (parts.length !== 2 || new Set(parts.map(part => part[0])).size !== 2) return false;
  const values = Object.fromEntries(parts);
  if (!/^\d{10}(\d{3})?$/.test(values.ts ?? "") || !/^[a-f0-9]{64}$/i.test(values.v1 ?? "")) return false;
  const timestamp = Number(values.ts) * (values.ts.length === 10 ? 1000 : 1);
  if (Math.abs(now - timestamp) > 10 * 60 * 1000) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${values.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(values.v1, "hex"));
}
