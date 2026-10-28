"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicRestaurant } from "@/lib/tenant";
import { rebuildOrder } from "@/lib/reorder";

export async function prepareReorderAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked)
    return {
      success: false as const,
      message: "Entre na sua conta para pedir novamente.",
    };
  if (typeof orderId !== "string" || orderId.length > 64)
    return { success: false as const, message: "Pedido não encontrado." };
  const restaurant = await getPublicRestaurant();
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
      restaurantId: restaurant.id,
    },
    select: { items: true },
  });
  if (!order)
    return { success: false as const, message: "Pedido não encontrado." };
  const products = await prisma.product.findMany({
    where: {
      restaurantId: restaurant.id,
      id: { in: order.items.map((item) => item.productId) },
    },
    include: { addons: { include: { addon: true } } },
  });
  return {
    success: true as const,
    ...rebuildOrder(order.items, products, restaurant.id),
  };
}
