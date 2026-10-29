import "server-only";
import { prisma } from "@/lib/prisma";
import type { DriverOrder } from "@/lib/driver";
export async function getDriverOrders(
  restaurantId: string,
  userId: string,
): Promise<DriverOrder[]> {
  return prisma.order.findMany({
    where: {
      restaurantId,
      entregadorId: userId,
      deliveryType: "ENTREGA",
      status: { in: ["PREPARANDO", "SAIU_PARA_ENTREGA"] },
    },
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentCardBrand: true,
      changeFor: true,
      notes: true,
      user: { select: { name: true, phone: true } },
      address: {
        select: {
          street: true,
          number: true,
          neighborhood: true,
          city: true,
          state: true,
          cep: true,
          complement: true,
          reference: true,
          navigationLatitude: true,
          navigationLongitude: true,
        },
      },
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          addonsLabel: true,
          removedLabel: true,
          notes: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
