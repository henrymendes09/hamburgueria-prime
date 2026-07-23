"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado.");
  }
  if (!session.user.restaurantId) throw new Error("Empresa não identificada.");
  return session.user.restaurantId;
}

export async function toggleCustomerBlockAction(
  userId: string,
  blocked: boolean
): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  await prisma.user.updateMany({ where: { id: userId, restaurantId, role: "CLIENTE" }, data: { blocked } });
  revalidatePath("/admin/clientes");
  return { success: true, message: blocked ? "Cliente bloqueado." : "Cliente desbloqueado." };
}

export async function createStaffAction(
  input: { name: string; email: string; password: string; role: "ADMIN" | "ENTREGADOR" }
): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  const bcrypt = await import("bcryptjs");
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { subscription: { select: { plan: { select: { maxUsers: true, name: true } } } } },
  });
  const maxUsers = restaurant?.subscription?.plan.maxUsers;
  if (maxUsers) {
    const currentUsers = await prisma.user.count({
      where: { restaurantId, role: { in: ["ADMIN", "ENTREGADOR"] } },
    });
    if (currentUsers >= maxUsers) {
      return {
        success: false,
        message: `O plano ${restaurant?.subscription?.plan.name} permite até ${maxUsers} usuários da equipe. Faça upgrade para adicionar mais.`,
      };
    }
  }
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return { success: false, message: "Email já cadastrado." };

  const passwordHash = await bcrypt.default.hash(input.password, 10);
  await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      restaurantId,
    },
  });
  revalidatePath("/admin/equipe");
  return { success: true, message: "Usuário da equipe criado." };
}
