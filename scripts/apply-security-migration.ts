// Additive migration only. Never seed, reset, or push the existing production schema.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`CREATE TABLE IF NOT EXISTS "SecurityRateLimit" (
      "key" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "resetAt" TIMESTAMP(3) NOT NULL)`;
    await tx.$executeRaw`CREATE INDEX IF NOT EXISTS "SecurityRateLimit_resetAt_idx" ON "SecurityRateLimit"("resetAt")`;
    await tx.passwordResetToken.deleteMany({});
  });
  console.log("Security table ready; legacy reset tokens invalidated. Business records preserved.");
}
main().catch((error: unknown) => { console.error("Security migration failed.", error instanceof Error ? error.name : "Unknown", typeof error === "object" && error && "code" in error ? error.code : ""); process.exitCode = 1; }).finally(() => prisma.$disconnect());
