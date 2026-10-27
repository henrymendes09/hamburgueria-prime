import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Actor = { user: { id: string; name?: string | null; role?: string; restaurantId?: string | null } };
export async function audited<T>(session: Actor, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async tx => {
    const actor = JSON.stringify({ id: session.user.id, name: session.user.name ?? "Administrador", role: session.user.role ?? "ADMIN", restaurantId: session.user.restaurantId });
    await tx.$executeRaw`SELECT set_config('app.audit_actor', ${actor}, true)`;
    return work(tx);
  }, { timeout: 15000 });
}
