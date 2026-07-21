"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addressSchema } from "@/lib/validations";

type ActionResult = { success: boolean; message: string };

export async function upsertAddressAction(
  addressId: string | null,
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Não autorizado." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  if (addressId) {
    const owned = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });
    if (!owned) return { success: false, message: "Endereço não encontrado." };
    await prisma.address.update({ where: { id: addressId }, data: parsed.data });
  } else {
    await prisma.address.create({ data: { ...parsed.data, userId: session.user.id } });
  }

  revalidatePath("/perfil/enderecos");
  return { success: true, message: "Endereço salvo." };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Não autorizado." };

  await prisma.address.deleteMany({ where: { id: addressId, userId: session.user.id } });
  revalidatePath("/perfil/enderecos");
  return { success: true, message: "Endereço removido." };
}
