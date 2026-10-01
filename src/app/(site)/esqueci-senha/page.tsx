import { AuthLayout } from "@/components/site/auth-layout";
import { ForgotPasswordForm } from "@/components/site/forgot-password-form";

export const metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle="Entre em contato com a loja para recuperar seu acesso"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
