"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { emitOrderEvent } from "@/lib/order-events";

type ActionResult = { success: boolean; message: string };

const NEXT_STATUS: Record<string, string[]> = {
  RECEBIDO: ["ACEITO", "RECUSADO"],
  ACEITO: ["PREPARANDO", "CANCELADO"],
  PREPARANDO: ["SAIU_PARA_ENTREGA", "CANCELADO"],
  SAIU_PARA_ENTREGA: ["ENTREGUE"],
  ENTREGUE: [],
  CANCELADO: [],
  RECUSADO: [],
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado.");
  }
  if (!session.user.restaurantId) throw new Error("Empresa não identificada.");
  return session;
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string
): Promise<ActionResult> {
  const session = await requireAdmin();

  const order = await prisma.order.findFirst({ where: { id: orderId, restaurantId: session.user.restaurantId! } });
  if (!order) return { success: false, message: "Pedido não encontrado." };

  const allowed = NEXT_STATUS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { success: false, message: `Não é possível mudar de ${order.status} para ${newStatus}.` };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus as never,
      acceptedAt: newStatus === "ACEITO" ? new Date() : order.acceptedAt,
      deliveredAt: newStatus === "ENTREGUE" ? new Date() : order.deliveredAt,
      paymentStatus:
        newStatus === "ENTREGUE" && order.paymentMethod !== "PIX" ? "PAGO" : order.paymentStatus,
      statusLog: { create: { status: newStatus as never } },
    },
  });

  emitOrderEvent({ type: "status-update", restaurantId: order.restaurantId, orderId, status: newStatus });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/pedido/${orderId}`);
  return { success: true, message: "Status atualizado." };
}

export async function assignEntregadorAction(
  orderId: string,
  entregadorId: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const restaurantId = session.user.restaurantId!;
  const entregador = await prisma.user.findFirst({ where: { id: entregadorId, restaurantId, role: "ENTREGADOR" } });
  if (!entregador) return { success: false, message: "Entregador não encontrado." };
  await prisma.order.updateMany({ where: { id: orderId, restaurantId }, data: { entregadorId } });
  revalidatePath("/admin/pedidos");
  return { success: true, message: "Entregador atribuído." };
}

export async function entregadorUpdateStatusAction(
  orderId: string,
  newStatus: "SAIU_PARA_ENTREGA" | "ENTREGUE"
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ENTREGADOR") {
    return { success: false, message: "Não autorizado." };
  }
  const order = await prisma.order.findFirst({
    where: { id: orderId, entregadorId: session.user.id, restaurantId: session.user.restaurantId ?? undefined },
  });
  if (!order) return { success: false, message: "Pedido não encontrado." };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      deliveredAt: newStatus === "ENTREGUE" ? new Date() : order.deliveredAt,
      paymentStatus:
        newStatus === "ENTREGUE" && order.paymentMethod !== "PIX" ? "PAGO" : order.paymentStatus,
      statusLog: { create: { status: newStatus } },
    },
  });

  revalidatePath("/entregador");
  return { success: true, message: "Status atualizado." };
}
