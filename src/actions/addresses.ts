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
  if (!session?.user?.id || session.user.blocked) return { success: false, message: "Não autorizado." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const saved = await prisma.$transaction(async tx => {
  const owned = addressId ? await tx.address.findFirst({ where: { id: addressId, userId: session.user.id } }) : null;
  if (addressId && !owned) return false;
  if (parsed.data.isDefault) {
    await tx.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  if (addressId) {
    const locationChanged = owned && (["cep", "street", "number", "neighborhood", "city", "state"] as const).some(key => owned[key] !== parsed.data[key]);
    await tx.address.update({ where: { id: addressId, userId: session.user.id }, data: { ...parsed.data, ...(locationChanged ? { latitude: null, longitude: null } : {}) } });
  } else {
    await tx.address.create({ data: { ...parsed.data, userId: session.user.id } });
  }
  return true;
  });
  if (!saved) return { success: false, message: "Endereço não encontrado." };

  revalidatePath("/perfil/enderecos");
  return { success: true, message: "Endereço salvo." };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked) return { success: false, message: "Não autorizado." };

  await prisma.address.deleteMany({ where: { id: addressId, userId: session.user.id } });
  revalidatePath("/perfil/enderecos");
  return { success: true, message: "Endereço removido." };
}
