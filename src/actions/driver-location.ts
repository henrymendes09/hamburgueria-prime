"use server";
import { deliveryAddress } from "@/lib/driver";
import { auth } from "@/lib/auth";
import { audited } from "@/lib/audit";
import { revalidatePath } from "next/cache";
export async function confirmDeliveryLocation(
  orderId: string,
  latitude: number,
  longitude: number,
  expectedAddress: string,
) {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.blocked ||
    session.user.role !== "ENTREGADOR" ||
    !session.user.restaurantId
  )
    return { success: false, message: "Não autorizado." };
  if (
    typeof orderId !== "string" ||
    orderId.length > 100 ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return { success: false, message: "Informe coordenadas válidas." };
  const result = await audited(session, async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        restaurantId: session.user.restaurantId!,
        entregadorId: session.user.id,
        deliveryType: "ENTREGA",
        status: { in: ["PREPARANDO", "SAIU_PARA_ENTREGA"] },
      },
      select: { address: true },
    });
    if (
      !order?.address ||
      typeof expectedAddress !== "string" ||
      deliveryAddress(order.address) !== expectedAddress
    )
      return false;
    const a = order.address;
    await tx.address.update({
      where: { id: a.id },
      data: { navigationLatitude: latitude, navigationLongitude: longitude },
    });
    await tx.auditLog.create({
      data: {
        restaurantId: session.user.restaurantId!,
        actorUserId: session.user.id,
        actorName: session.user.name ?? "Entregador",
        actorRole: "ENTREGADOR",
        resource: "Address",
        resourceId: a.id,
        action: "UPDATE",
        changedFields: ["navigationLatitude", "navigationLongitude"],
        before: {
          navigationLatitude: a.navigationLatitude,
          navigationLongitude: a.navigationLongitude,
        },
        after: { navigationLatitude: latitude, navigationLongitude: longitude },
      },
    });
    return true;
  });
  if (!result)
    return {
      success: false,
      message: "Entrega não encontrada ou não está mais atribuída a você.",
    };
  revalidatePath("/entregador");
  return { success: true, message: "Ponto de entrega confirmado." };
}
