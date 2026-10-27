"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
export async function readOrderNotifications(id?: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || !session.user.restaurantId || (id !== undefined && (typeof id !== "string" || id.length > 100))) return { success: false };
  await prisma.orderNotification.updateMany({ where: { userId: session.user.id, restaurantId: session.user.restaurantId, ...(id ? { id } : {}) }, data: { read: true } });
  revalidatePath("/perfil/notificacoes");
  return { success: true };
}
