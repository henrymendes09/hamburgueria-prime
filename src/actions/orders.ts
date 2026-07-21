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
  return session;
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string
): Promise<ActionResult> {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
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
        newStatus === "ENTREGUE" && order.paymentMethod !== "CARTAO" ? "PAGO" : order.paymentStatus,
      statusLog: { create: { status: newStatus as never } },
    },
  });

  emitOrderEvent({ type: "status-update", orderId, status: newStatus });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/pedido/${orderId}`);
  return { success: true, message: "Status atualizado." };
}

export async function assignEntregadorAction(
  orderId: string,
  entregadorId: string
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { entregadorId } });
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
    where: { id: orderId, entregadorId: session.user.id },
  });
  if (!order) return { success: false, message: "Pedido não encontrado." };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      deliveredAt: newStatus === "ENTREGUE" ? new Date() : order.deliveredAt,
      paymentStatus: newStatus === "ENTREGUE" ? "PAGO" : order.paymentStatus,
      statusLog: { create: { status: newStatus } },
    },
  });

  revalidatePath("/entregador");
  return { success: true, message: "Status atualizado." };
}
