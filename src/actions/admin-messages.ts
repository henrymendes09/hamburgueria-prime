"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markContactMessageRead(id: string) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.blocked || user.role !== "ADMIN" || !user.restaurantId) {
    return { success: false, message: "Não autorizado." };
  }
  if (typeof id !== "string" || id.length > 100 || !id) return { success: false, message: "Mensagem inválida." };
  const result = await prisma.contactMessage.updateMany({ where: { id, restaurantId: user.restaurantId }, data: { read: true } });
  return { success: result.count === 1, message: result.count === 1 ? "Mensagem marcada como lida." : "Mensagem não encontrada." };
}
