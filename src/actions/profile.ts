"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().optional(),
});

export async function updateProfileAction(input: unknown): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Não autorizado." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.user.update({ where: { id: session.user.id }, data: parsed.data });
  revalidatePath("/perfil");
  return { success: true, message: "Perfil atualizado com sucesso." };
}
