import { AuthLayout } from "@/components/site/auth-layout";
import { RegisterForm } from "@/components/site/register-form";

export const metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <AuthLayout title="Criar conta" subtitle="Cadastre-se para pedir mais rápido da próxima vez">
      <RegisterForm />
    </AuthLayout>
  );
}
