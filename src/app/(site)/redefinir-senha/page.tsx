import { AuthLayout } from "@/components/site/auth-layout";
import { ResetPasswordForm } from "@/components/site/reset-password-form";

export const metadata = { title: "Redefinir senha" };

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthLayout title="Redefinir senha" subtitle="Escolha uma nova senha para sua conta">
      <ResetPasswordForm token={token ?? ""} />
    </AuthLayout>
  );
}
