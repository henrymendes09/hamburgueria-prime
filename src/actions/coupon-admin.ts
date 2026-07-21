"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { couponSchema } from "@/lib/validations";

type ActionResult = { success: boolean; message: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado.");
  }
}

export async function upsertCouponAction(
  couponId: string | null,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing && existing.id !== couponId) {
    return { success: false, message: "Já existe um cupom com este código." };
  }

  const payload = {
    code: data.code,
    type: data.type,
    value: data.value,
    maxUses: data.maxUses || null,
    minOrderValue: data.minOrderValue ?? 0,
    expiresAt: new Date(data.expiresAt),
    singleUsePerUser: data.singleUsePerUser ?? true,
  };

  if (couponId) {
    await prisma.coupon.update({ where: { id: couponId }, data: payload });
  } else {
    await prisma.coupon.create({ data: payload });
  }

  revalidatePath("/admin/cupons");
  return { success: true, message: "Cupom salvo." };
}

export async function toggleCouponAction(couponId: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.coupon.update({ where: { id: couponId }, data: { active } });
  revalidatePath("/admin/cupons");
  return { success: true, message: "Cupom atualizado." };
}

export async function deleteCouponAction(couponId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id: couponId } });
  revalidatePath("/admin/cupons");
  return { success: true, message: "Cupom removido." };
}
