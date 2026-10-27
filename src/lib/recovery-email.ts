import nodemailer from "nodemailer";

export function emailIsConfigured() {
  return Boolean(process.env.GMAIL_USER && /^[a-z0-9]{16}$/i.test((process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "")));
}

export async function sendPasswordResetEmail(recipient: string, token: string) {
  if (!emailIsConfigured()) throw new Error("email_not_configured");
  const base = new URL(process.env.NEXTAUTH_URL || "https://hamburgueria-prime.vercel.app");
  if (base.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("invalid_email_origin");
  const link = new URL("/redefinir-senha", base);
  link.searchParams.set("token", token);
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: process.env.GMAIL_USER!, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "") },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    const result = await transport.sendMail({
      from: { name: "Hamburgueria Prime", address: process.env.GMAIL_USER! },
      to: recipient,
      subject: "Redefinir sua senha — Hamburgueria Prime",
      text: `Recebemos uma solicitação para redefinir sua senha.\n\nAbra este link para escolher uma nova senha:\n${link.toString()}\n\nO link expira em 30 minutos e só pode ser usado uma vez.\nSe você não fez essa solicitação, ignore esta mensagem. Sua senha permanece a mesma.`,
    });
    if (!result.accepted?.length) throw new Error("email_not_accepted");
  } finally { transport.close(); }
}
