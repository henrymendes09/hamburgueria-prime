"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cardSchema } from "@/lib/validations";

type ActionResult = { success: boolean; message: string };

export async function addCardAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked) return { success: false, message: "Não autorizado." };

  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.card.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  });

  revalidatePath("/perfil/cartoes");
  return { success: true, message: "Cartão adicionado." };
}

export async function deleteCardAction(cardId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked) return { success: false, message: "Não autorizado." };

  await prisma.card.deleteMany({ where: { id: cardId, userId: session.user.id } });
  revalidatePath("/perfil/cartoes");
  return { success: true, message: "Cartão removido." };
}
