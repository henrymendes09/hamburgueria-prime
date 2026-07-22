import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Painel Administrativo — Login" };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role === "ADMIN") redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="stamp mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-flame font-display text-2xl text-white">
            HP
          </div>
          <h1 className="font-display text-2xl text-paper">Painel Administrativo</h1>
          <p className="text-sm text-paper/50 normal-case mt-1">Hamburgueria Prime</p>
        </div>
        <div className="rounded-2xl bg-white p-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
