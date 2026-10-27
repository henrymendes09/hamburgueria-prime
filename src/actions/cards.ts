"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";


type ActionResult = { success: boolean; message: string };

export async function addCardAction(input: unknown): Promise<ActionResult> {
  void input;
  return { success: false, message: "O cadastro de cartões foi desativado. Escolha o pagamento no checkout." };
}

export async function deleteCardAction(cardId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked) return { success: false, message: "Não autorizado." };

  await prisma.card.deleteMany({ where: { id: cardId, userId: session.user.id } });
  revalidatePath("/perfil/cartoes");
  return { success: true, message: "Cartão removido." };
}
