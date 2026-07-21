"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cardSchema } from "@/lib/validations";

type ActionResult = { success: boolean; message: string };

export async function addCardAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Não autorizado." };

  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { number, cvv, ...rest } = parsed.data;
  void cvv; // O CVV nunca é armazenado — usado apenas na hora da cobrança real (gateway de pagamento)

  await prisma.card.create({
    data: {
      ...rest,
      last4: number.slice(-4),
      userId: session.user.id,
    },
  });

  revalidatePath("/perfil/cartoes");
  return { success: true, message: "Cartão adicionado." };
}

export async function deleteCardAction(cardId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Não autorizado." };

  await prisma.card.deleteMany({ where: { id: cardId, userId: session.user.id } });
  revalidatePath("/perfil/cartoes");
  return { success: true, message: "Cartão removido." };
}
