"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  registerSchema,
  forgotPasswordSchema,
} from "@/lib/validations";
import { headers } from "next/headers";
import { getPublicRestaurant } from "@/lib/tenant";

type ActionResult = { success: boolean; message: string };

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "local";
  return `${prefix}:${ip}`;
}

export async function registerAction(
  input: unknown
): Promise<ActionResult & { fieldErrors?: Record<string, string> }> {
  const key = await clientKey("register");
  const limited = await rateLimit(key, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limited.success) {
    return { success: false, message: "Muitas tentativas. Tente novamente em alguns minutos." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as string] = issue.message;
    }
    return { success: false, message: "Verifique os dados informados.", fieldErrors };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      message: "Este email já está cadastrado.",
      fieldErrors: { email: "Este email já está cadastrado." },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const restaurant = await getPublicRestaurant();

  await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "CLIENTE", restaurantId: restaurant.id },
  });

  return { success: true, message: "Conta criada com sucesso! Faça login para continuar." };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const key = await clientKey("forgot-password");
  const limited = await rateLimit(key, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limited.success) {
    return { success: false, message: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Email inválido." };
  }

  // Recovery stays disabled until a verified delivery channel is configured.
  // Never issue a bearer token to an anonymous requester, including in development.
  return {
    success: true,
    message: "Para recuperar o acesso, entre em contato com a loja.",
  };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  // Previously issued tokens were disclosed publicly. Reject all of them.
  void input;
  return { success: false, message: "Este link não está mais disponível. Entre em contato com a loja." };

}
