import { Suspense } from "react";
import { AuthLayout } from "@/components/site/auth-layout";
import { LoginForm } from "@/components/site/login-form";

export const metadata = { title: "Login" };

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre para acompanhar seus pedidos e favoritos">
      <Suspense fallback={null}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthLayout>
  );
}
