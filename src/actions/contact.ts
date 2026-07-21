"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const contactSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Informe o assunto"),
  message: z.string().min(10, "Escreva uma mensagem com mais detalhes"),
});

export async function sendContactMessageAction(
  input: unknown
): Promise<{ success: boolean; message: string }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.success) {
    return { success: false, message: "Muitas mensagens enviadas. Tente novamente mais tarde." };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.contactMessage.create({ data: parsed.data });

  return { success: true, message: "Mensagem enviada! Responderemos em breve." };
}
