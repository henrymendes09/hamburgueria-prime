"use server";

import { auth } from "@/lib/auth";

import { siteContentSchema } from "@/lib/site-content";
import { revalidatePath } from "next/cache";
import { audited } from "@/lib/audit";

export async function saveSiteContentAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || session.user.role !== "ADMIN" || !session.user.restaurantId) return { success: false, message: "Não autorizado." };
  const parsed = siteContentSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  await audited(session, tx => tx.restaurant.update({ where: { id: session.user.restaurantId! }, data: { siteContent: parsed.data } }));
  revalidatePath("/sobre"); revalidatePath("/contato"); revalidatePath("/admin/conteudo");
  return { success: true, message: "Conteúdo atualizado no site." };
}
