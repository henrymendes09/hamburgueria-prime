"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/lib/validations";
import { CartItem } from "@/types/cart";
import { itemPrice } from "@/lib/cart-store";
import { headers } from "next/headers";
import { emitOrderEvent } from "@/lib/order-events";

type CheckoutResult =
  | { success: true; orderId: string; orderNumber: number }
  | { success: false; message: string };

export async function checkoutAction(
  rawInput: unknown,
  items: CartItem[]
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado para finalizar o pedido." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`checkout:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limited.success) {
    return { success: false, message: "Muitos pedidos em pouco tempo. Aguarde um instante." };
  }

  if (!items || items.length === 0) {
    return { success: false, message: "Seu carrinho está vazio." };
  }

  const parsed = checkoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  // Revalida preços/disponibilidade no servidor (nunca confia no preço vindo do cliente)
  const productIds = items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of items) {
    const dbProduct = productMap.get(item.productId);
    if (!dbProduct || !dbProduct.available) {
      return { success: false, message: `O produto "${item.name}" não está mais disponível.` };
    }
  }

  const subtotal = items.reduce((sum, item) => sum + itemPrice(item), 0);

  // Endereço: usa existente ou cria um novo a partir do checkout
  let addressId: string | undefined;
  if (data.deliveryType === "ENTREGA") {
    if (data.addressId) {
      const addr = await prisma.address.findFirst({
        where: { id: data.addressId, userId: session.user.id },
      });
      if (!addr) return { success: false, message: "Endereço inválido." };
      addressId = addr.id;
    } else if (data.newAddress) {
      const created = await prisma.address.create({
        data: { ...data.newAddress, userId: session.user.id },
      });
      addressId = created.id;
    } else {
      return { success: false, message: "Informe o endereço de entrega." };
    }
  }

  const deliveryFee =
    data.deliveryType === "RETIRADA"
      ? 0
      : subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE;

  // Cupom
  let discount = 0;
  let couponId: string | undefined;
  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode.trim().toUpperCase() },
    });
    if (
      coupon &&
      coupon.active &&
      coupon.expiresAt > new Date() &&
      subtotal >= coupon.minOrderValue &&
      (!coupon.maxUses || coupon.usedCount < coupon.maxUses)
    ) {
      discount = coupon.type === "PERCENTUAL" ? (subtotal * coupon.value) / 100 : coupon.value;
      discount = Math.min(discount, subtotal);
      couponId = coupon.id;
    }
  }

  const total = Math.max(subtotal + deliveryFee - discount, 0);

  const order = await prisma.$transaction(async (tx) => {
    const lastOrder = await tx.order.findFirst({
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextOrderNumber = (lastOrder?.number ?? 0) + 1;
    const created = await tx.order.create({
      data: {
        number: nextOrderNumber,
        userId: session.user.id,
        addressId,
        deliveryType: data.deliveryType,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        paymentMethod: data.paymentMethod,
        changeFor: data.changeFor,
        subtotal,
        deliveryFee,
        discount,
        total,
        notes: data.notes,
        couponId,
        status: "RECEBIDO",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            addonsLabel: item.addons.map((a) => a.name).join(", ") || null,
            removedLabel: item.removedIngredients.join(", ") || null,
            notes: item.notes || null,
          })),
        },
        statusLog: { create: { status: "RECEBIDO" } },
      },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      await tx.couponRedemption.create({
        data: { couponId, userId: session.user.id, orderId: created.id },
      });
    }

    await tx.user.update({
      where: { id: session.user.id },
      data: { name: data.name, phone: data.phone, cpf: data.cpf },
    });

    return created;
  });

  emitOrderEvent({ type: "new-order", orderId: order.id, orderNumber: order.number });

  return { success: true, orderId: order.id, orderNumber: order.number };
}
