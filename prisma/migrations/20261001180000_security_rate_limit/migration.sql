-- Additive security storage; no existing business tables or data are changed.
CREATE TABLE IF NOT EXISTS "SecurityRateLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityRateLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "SecurityRateLimit_resetAt_idx" ON "SecurityRateLimit"("resetAt");
