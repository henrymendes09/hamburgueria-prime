"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPublicRestaurant } from "@/lib/tenant";

type CouponResult =
  | { success: true; coupon: { code: string; type: "PERCENTUAL" | "VALOR"; value: number } }
  | { success: false; message: string };

export async function validateCouponAction(code: string, subtotal: number): Promise<CouponResult> {
  const session = await auth();
  const restaurant = await getPublicRestaurant();
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurant.id) return { success: false, message: "Entre com uma conta desta hamburgueria." };
  const coupon = await prisma.coupon.findUnique({ where: { restaurantId_code: { restaurantId: restaurant.id, code: code.trim().toUpperCase() } } });

  if (!coupon || !coupon.active) {
    return { success: false, message: "Cupom não encontrado." };
  }
  if (coupon.expiresAt < new Date()) {
    return { success: false, message: "Este cupom expirou." };
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { success: false, message: "Este cupom atingiu o limite de usos." };
  }
  if (subtotal < coupon.minOrderValue) {
    return {
      success: false,
      message: `Pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2)} para usar este cupom.`,
    };
  }
  if (coupon.singleUsePerUser && session?.user?.id) {
    const already = await prisma.couponRedemption.findFirst({
      where: { couponId: coupon.id, userId: session.user.id },
    });
    if (already) {
      return { success: false, message: "Você já utilizou este cupom." };
    }
  }

  return {
    success: true,
    coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
  };
}
