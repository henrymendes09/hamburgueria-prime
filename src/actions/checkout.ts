"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations";
import { CartItem } from "@/types/cart";
import { headers } from "next/headers";
import { emitOrderEvent } from "@/lib/order-events";
import crypto from "crypto";
import { getPublicRestaurant } from "@/lib/tenant";
import { calculateDeliveryQuote, DeliveryQuote } from "@/lib/delivery";

type CheckoutResult =
  | { success: true; orderId: string; orderNumber: number }
  | { success: false; message: string };

type PixPayment = {
  id: string;
  qrCode: string;
  qrCodeBase64: string;
};

type DeliveryQuoteResult =
  | { success: true; quote: DeliveryQuote }
  | { success: false; message: string };

export async function quoteDeliveryAction(input: {
  addressId?: string;
  cep?: string;
  address?: { street?: string; number?: string; neighborhood?: string; city?: string; state?: string };
  subtotal: number;
}): Promise<DeliveryQuoteResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Faça login para calcular a entrega." };

  const restaurant = await getPublicRestaurant();
  if (!restaurant.storeCep) {
    const free = restaurant.freeDeliveryThreshold != null && input.subtotal >= restaurant.freeDeliveryThreshold;
    return {
      success: true,
      quote: { distanceKm: null, customerFee: free ? 0 : restaurant.deliveryFee, driverPayout: restaurant.deliveryFee },
    };
  }

  let customerCep = input.cep;
  let customerAddress = input.address
    ? [input.address.street, input.address.number, input.address.neighborhood, input.address.city, input.address.state].filter(Boolean).join(", ")
    : undefined;
  if (input.addressId) {
    const address = await prisma.address.findFirst({
      where: { id: input.addressId, userId: session.user.id },
      select: { cep: true, street: true, number: true, neighborhood: true, city: true, state: true },
    });
    customerCep = address?.cep;
    customerAddress = address
      ? [address.street, address.number, address.neighborhood, address.city, address.state].join(", ")
      : undefined;
  }
  if (!customerCep) return { success: false, message: "Informe um CEP válido." };

  const result = await calculateDeliveryQuote({
    storeCep: restaurant.storeCep,
    customerCep,
    storeAddress: restaurant.address ?? undefined,
    customerAddress,
    baseFee: restaurant.deliveryFee,
    feePerKm: restaurant.deliveryFeePerKm,
    freeDeliveryThreshold: restaurant.freeDeliveryThreshold,
    subtotal: Math.max(input.subtotal, 0),
  });
  if (!result) return { success: false, message: "Não foi possível localizar este CEP." };
  if (result.quote.distanceKm != null && result.quote.distanceKm > restaurant.deliveryRadiusKm) {
    return { success: false, message: `Endereço fora do raio de ${restaurant.deliveryRadiusKm} km da loja.` };
  }
  return { success: true, quote: result.quote };
}

function calculateItemPrice(item: CartItem): number {
  const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.price, 0);
  return (item.unitPrice + addonsTotal) * item.quantity;
}

async function createPixPayment(input: {
  amount: number;
  email: string;
  description: string;
}): Promise<PixPayment> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken || accessToken.length < 30) {
    throw new Error("O pagamento Pix ainda não está configurado. Escolha cartão ou dinheiro.");
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      payment_method_id: "pix",
      payer: { email: input.email },
    }),
    cache: "no-store",
  });

  const payment = await response.json();
  const transaction = payment?.point_of_interaction?.transaction_data;
  if (!response.ok || !payment?.id || !transaction?.qr_code || !transaction?.qr_code_base64) {
    throw new Error(payment?.message || "Não foi possível gerar o Pix. Escolha outro pagamento.");
  }

  return {
    id: String(payment.id),
    qrCode: transaction.qr_code,
    qrCodeBase64: transaction.qr_code_base64,
  };
}

export async function checkoutAction(
  rawInput: unknown,
  items: CartItem[]
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado para finalizar o pedido." };
  }
  const activeRestaurant = await getPublicRestaurant();
  if (!session.user.restaurantId || session.user.restaurantId !== activeRestaurant.id) {
    return { success: false, message: "Sua conta não está vinculada a uma hamburgueria." };
  }
  const restaurantId = activeRestaurant.id;

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
  const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds }, restaurantId } });
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of items) {
    const dbProduct = productMap.get(item.productId);
    if (!dbProduct || !dbProduct.available) {
      return { success: false, message: `O produto "${item.name}" não está mais disponível.` };
    }
  }

  const subtotal = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);

  // Endereço: usa existente ou cria um novo a partir do checkout
  let addressId: string | undefined;
  let deliveryAddress: {
    cep: string; street: string; number: string; neighborhood: string; city: string; state: string;
    latitude: number | null; longitude: number | null;
  } | null = null;
  if (data.deliveryType === "ENTREGA") {
    if (data.addressId) {
      const addr = await prisma.address.findFirst({
        where: { id: data.addressId, userId: session.user.id },
      });
      if (!addr) return { success: false, message: "Endereço inválido." };
      addressId = addr.id;
      deliveryAddress = addr;
    } else if (data.newAddress) {
      const created = await prisma.address.create({
        data: { ...data.newAddress, userId: session.user.id },
      });
      addressId = created.id;
      deliveryAddress = created;
    } else {
      return { success: false, message: "Informe o endereço de entrega." };
    }
  }

  let deliveryFee = 0;
  let deliveryPayout = 0;
  let deliveryDistanceKm: number | null = null;
  if (data.deliveryType === "ENTREGA") {
    if (activeRestaurant.storeCep && deliveryAddress) {
      const delivery = await calculateDeliveryQuote({
        storeCep: activeRestaurant.storeCep,
        customerCep: deliveryAddress.cep,
        storeAddress: activeRestaurant.address ?? undefined,
        customerAddress: [deliveryAddress.street, deliveryAddress.number, deliveryAddress.neighborhood, deliveryAddress.city, deliveryAddress.state].join(", "),
        baseFee: activeRestaurant.deliveryFee,
        feePerKm: activeRestaurant.deliveryFeePerKm,
        freeDeliveryThreshold: activeRestaurant.freeDeliveryThreshold,
        subtotal,
      });
      if (!delivery) return { success: false, message: "Não foi possível calcular a distância para este CEP." };
      if (delivery.quote.distanceKm != null && delivery.quote.distanceKm > activeRestaurant.deliveryRadiusKm) {
        return { success: false, message: `Endereço fora do raio de ${activeRestaurant.deliveryRadiusKm} km da loja.` };
      }
      deliveryFee = delivery.quote.customerFee;
      deliveryPayout = delivery.quote.driverPayout;
      deliveryDistanceKm = delivery.quote.distanceKm;
      if (deliveryAddress.latitude == null || deliveryAddress.longitude == null) {
        await prisma.address.update({ where: { id: addressId! }, data: delivery.coordinates });
      }
    } else {
      deliveryPayout = activeRestaurant.deliveryFee;
      deliveryFee = activeRestaurant.freeDeliveryThreshold != null && subtotal >= activeRestaurant.freeDeliveryThreshold
        ? 0
        : activeRestaurant.deliveryFee;
    }
  }

  // Cupom
  let discount = 0;
  let couponId: string | undefined;
  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { restaurantId_code: { restaurantId, code: data.couponCode.trim().toUpperCase() } },
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

  let pixPayment: PixPayment | null = null;
  if (data.paymentMethod === "PIX") {
    try {
      pixPayment = await createPixPayment({
        amount: total,
        email: session.user.email ?? "cliente@hamburgueriaprime.com.br",
        description: "Pedido Hamburgueria Prime",
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Não foi possível gerar o Pix.",
      };
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const lastOrder = await tx.order.findFirst({
      where: { restaurantId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextOrderNumber = (lastOrder?.number ?? 0) + 1;
    const created = await tx.order.create({
      data: {
        restaurantId,
        number: nextOrderNumber,
        userId: session.user.id,
        addressId,
        deliveryType: data.deliveryType,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        paymentMethod: data.paymentMethod,
        paymentExternalId: pixPayment?.id,
        pixQrCode: pixPayment?.qrCode,
        pixQrCodeBase64: pixPayment?.qrCodeBase64,
        changeFor: data.changeFor,
        subtotal,
        deliveryFee,
        deliveryDistanceKm,
        deliveryPayout,
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

  emitOrderEvent({ type: "new-order", restaurantId, orderId: order.id, orderNumber: order.number });

  return { success: true, orderId: order.id, orderNumber: order.number };
}
