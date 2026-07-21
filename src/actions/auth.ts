"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations";
import { headers } from "next/headers";

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
  const limited = rateLimit(key, { limit: 10, windowMs: 10 * 60 * 1000 });
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

  await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "CLIENTE" },
  });

  return { success: true, message: "Conta criada com sucesso! Faça login para continuar." };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult & { devToken?: string }> {
  const key = await clientKey("forgot-password");
  const limited = rateLimit(key, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limited.success) {
    return { success: false, message: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Email inválido." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Sempre responde com sucesso (não revela se o email existe, por segurança)
  if (!user) {
    return {
      success: true,
      message: "Se este email existir na nossa base, você receberá as instruções.",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expires: new Date(Date.now() + 1000 * 60 * 30), // 30 minutos
    },
  });

  // Sem um provedor de email (SMTP/Resend/SendGrid) configurado neste projeto,
  // retornamos o token de desenvolvimento para você testar o fluxo localmente.
  // Em produção, envie este link por email em vez de expô-lo na tela.
  return {
    success: true,
    message: "Link de redefinição gerado.",
    devToken: token,
  };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.expires < new Date()) {
    return { success: false, message: "Link inválido ou expirado. Solicite um novo." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
  ]);

  return { success: true, message: "Senha redefinida com sucesso. Faça login." };
}
