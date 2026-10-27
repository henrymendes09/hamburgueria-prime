import { AuthLayout } from "@/components/site/auth-layout";
import { RegisterForm } from "@/components/site/register-form";
import { Suspense } from "react";

export const metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <AuthLayout title="Criar conta" subtitle="Cadastre-se para pedir mais rápido da próxima vez">
      <Suspense fallback={null}><RegisterForm /></Suspense>
    </AuthLayout>
  );
}
