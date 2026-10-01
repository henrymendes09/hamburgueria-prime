import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

type Bucket = { count: number; resetAt: number };
type LimitResult = { success: boolean; remaining: number };
const buckets = new Map<string, Bucket>();

export function clientIp(headers: { get(name: string): string | null }) {
  return (headers.get("x-vercel-forwarded-for") || headers.get("x-real-ip") || headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 64);
}

export async function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }): Promise<LimitResult> {
  const now = Date.now();
  const hashedKey = crypto.createHash("sha256").update(key.slice(0, 1024)).digest("hex");
  if (process.env.NODE_ENV !== "production") {
    for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id);
    if (buckets.size >= 10000 && !buckets.has(hashedKey)) return { success: false, remaining: 0 };
    const bucket = buckets.get(hashedKey) ?? { count: 0, resetAt: now + windowMs };
    bucket.count = Math.min(bucket.count + 1, limit + 1);
    buckets.set(hashedKey, bucket);
    return { success: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
  }
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "SecurityRateLimit" ("key", "count", "resetAt")
      VALUES (${hashedKey}, 1, ${new Date(now + windowMs)})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "SecurityRateLimit"."resetAt" <= ${new Date(now)} THEN 1
          ELSE LEAST("SecurityRateLimit"."count" + 1, ${limit + 1}) END,
        "resetAt" = CASE WHEN "SecurityRateLimit"."resetAt" <= ${new Date(now)}
          THEN ${new Date(now + windowMs)} ELSE "SecurityRateLimit"."resetAt" END
      RETURNING "count"`;
    if (Math.random() < 0.01) {
      await prisma.$executeRaw`DELETE FROM "SecurityRateLimit" WHERE "key" IN
        (SELECT "key" FROM "SecurityRateLimit" WHERE "resetAt" < ${new Date(now)} LIMIT 200)`;
    }
    const count = rows[0]?.count ?? limit + 1;
    return { success: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    console.error("Security rate limiter unavailable; request denied.");
    return { success: false, remaining: 0 };
  }
}
