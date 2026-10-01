"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getPublicRestaurant } from "@/lib/tenant";

const contactSchema = z.object({
  name: z.string().min(2, "Informe seu nome").max(100),
  email: z.string().email("Email inválido").max(254),
  phone: z.string().max(30).optional(),
  subject: z.string().min(2, "Informe o assunto").max(200),
  message: z.string().min(10, "Escreva uma mensagem com mais detalhes").max(5000),
});

export async function sendContactMessageAction(
  input: unknown
): Promise<{ success: boolean; message: string }> {
  const h = await headers();
  const ip = clientIp(h);
  const limited = await rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.success) {
    return { success: false, message: "Muitas mensagens enviadas. Tente novamente mais tarde." };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const restaurant = await getPublicRestaurant();
  await prisma.contactMessage.create({ data: { ...parsed.data, restaurantId: restaurant.id } });

  return { success: true, message: "Mensagem enviada! Responderemos em breve." };
}
