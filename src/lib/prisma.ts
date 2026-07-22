import { PrismaClient } from "@prisma/client";

// Evita recriar o PrismaClient a cada hot-reload em desenvolvimento.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function runtimeDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
    return url.toString();
  } catch {
    return value;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: runtimeDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
