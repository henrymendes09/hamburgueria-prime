"use server";
import { auth } from "@/lib/auth";
import { audited } from "@/lib/audit";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { deliverOrderEmails } from "@/lib/order-notifications";
import { emitOrderEvent } from "@/lib/order-events";
export async function dispatchDriverOrders(ids: string[]) {
  const session = await auth();
  const failure = (message: string) => ({
    success: false,
    message,
    dispatchedIds: [] as string[],
  });
  if (
    !session?.user?.id ||
    session.user.blocked ||
    session.user.role !== "ENTREGADOR" ||
    !session.user.restaurantId
  )
    return failure("Não autorizado.");
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 10 ||
    ids.some((id) => typeof id !== "string" || !id || id.length > 100) ||
    new Set(ids).size !== ids.length
  )
    return failure("Selecione até 10 pedidos diferentes.");
  const restaurantId = session.user.restaurantId,
    entregadorId = session.user.id;
  try {
    const result = await audited(session, async (tx) => {
      const orders = await tx.order.findMany({
        where: {
          id: { in: ids },
          restaurantId,
          entregadorId,
          deliveryType: "ENTREGA",
          addressId: { not: null },
          status: { in: ["PREPARANDO", "SAIU_PARA_ENTREGA"] },
        },
        select: { id: true, status: true },
      });
      if (orders.length !== ids.length)
        return failure(
          "Algum pedido foi alterado ou não está atribuído a você. Atualize a lista; nenhum pedido foi despachado.",
        );
      const ready = orders
        .filter((o) => o.status === "PREPARANDO")
        .map((o) => o.id);
      if (ready.length) {
        const changed = await tx.order.updateMany({
          where: {
            id: { in: ready },
            restaurantId,
            entregadorId,
            deliveryType: "ENTREGA",
            status: "PREPARANDO",
          },
          data: { status: "SAIU_PARA_ENTREGA" },
        });
        if (changed.count !== ready.length)
          throw Error("Pedidos alterados durante a saída.");
        await tx.orderStatusLog.createMany({
          data: ready.map((orderId) => ({
            orderId,
            status: "SAIU_PARA_ENTREGA" as const,
          })),
        });
      }
      return {
        success: true,
        message: ready.length
          ? `${ready.length} pedido(s) saíram para entrega.`
          : "Os pedidos selecionados já estão em entrega.",
        dispatchedIds: ready,
      };
    });
    if (result.success) {
      after(async () => {
        await Promise.allSettled(
          result.dispatchedIds.map((orderId) =>
            deliverOrderEmails({ restaurantId, orderId }),
          ),
        );
      });
      for (const orderId of result.dispatchedIds) {
        emitOrderEvent({
          type: "status-update",
          restaurantId,
          orderId,
          status: "SAIU_PARA_ENTREGA",
        });
        revalidatePath(`/pedido/${orderId}`);
      }
      revalidatePath("/entregador");
      revalidatePath("/admin/cozinha");
      revalidatePath("/admin/pedidos");
    }
    return result;
  } catch {
    return failure(
      "Não foi possível registrar a saída de todos os pedidos. Nenhum foi despachado; atualize e tente novamente.",
    );
  }
}
