import { AuthLayout } from "@/components/site/auth-layout";
import { ForgotPasswordForm } from "@/components/site/forgot-password-form";

export const metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle="Informe seu email e enviaremos as instruções de redefinição"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
