import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { auth } from "@/lib/auth";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-paper-dim">
      <AdminSidebar userName={session?.user?.name ?? "Admin"} />
      <main className="flex-1 p-4 sm:p-8 lg:ml-64">{children}</main>
    </div>
  );
}
