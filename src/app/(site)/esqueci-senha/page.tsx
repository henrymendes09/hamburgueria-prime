import { AuthLayout } from "@/components/site/auth-layout";
import { ForgotPasswordForm } from "@/components/site/forgot-password-form";
import { emailIsConfigured } from "@/lib/recovery-email";

export const metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle={emailIsConfigured() ? "Informe seu e-mail para receber o link de recuperação" : "Entre em contato com a loja para recuperar seu acesso"}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
