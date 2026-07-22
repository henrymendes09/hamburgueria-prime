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
