import "server-only";
import { prisma } from "@/lib/prisma";
import type { KitchenOrder } from "@/lib/kitchen";
import { preparationIngredients } from "@/lib/kitchen";
export async function getKitchenOrders(
  restaurantId: string,
): Promise<KitchenOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { in: ["RECEBIDO", "ACEITO", "PREPARANDO"] },
    },
    select: {
      id: true,
      number: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      deliveryType: true,
      createdAt: true,
      scheduledFor: true,
      notes: true,
      user: { select: { name: true } },
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          addonsLabel: true,
          removedLabel: true,
          notes: true,
          product: { select: { ingredients: true, restaurantId: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return orders.map((order) => ({
    ...order,
    items: order.items.map(({ product, ...item }) => ({
      ...item,
      ingredients:
        product.restaurantId === restaurantId
          ? preparationIngredients(product.ingredients, item.removedLabel)
          : [],
    })),
    createdAt: order.createdAt.toISOString(),
    scheduledFor: order.scheduledFor?.toISOString() ?? null,
  }));
}
