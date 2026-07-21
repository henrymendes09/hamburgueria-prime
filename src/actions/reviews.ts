"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { reviewSchema } from "@/lib/validations";

type ActionResult = { success: boolean; message: string; favorited?: boolean };

export async function toggleFavoriteAction(productId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Faça login para favoritar produtos." };

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/cardapio");
    revalidatePath("/perfil/favoritos");
    return { success: true, message: "Removido dos favoritos.", favorited: false };
  }

  await prisma.favorite.create({ data: { userId: session.user.id, productId } });
  revalidatePath("/cardapio");
  revalidatePath("/perfil/favoritos");
  return { success: true, message: "Adicionado aos favoritos!", favorited: true };
}

export async function createReviewAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Faça login para avaliar." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.review.create({
    data: {
      userId: session.user.id,
      productId: parsed.data.productId || null,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  if (parsed.data.productId) {
    const agg = await prisma.review.aggregate({
      where: { productId: parsed.data.productId },
      _avg: { rating: true },
    });
    await prisma.product.update({
      where: { id: parsed.data.productId },
      data: { rating: agg._avg.rating ?? 5 },
    });
  }

  revalidatePath("/");
  revalidatePath("/cardapio");
  return { success: true, message: "Avaliação enviada. Obrigado!" };
}
