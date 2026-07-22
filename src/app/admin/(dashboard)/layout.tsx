import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const restaurant = session?.user?.restaurantId
    ? await prisma.restaurant.findUnique({ where: { id: session.user.restaurantId }, select: { slug: true } })
    : null;

  return (
    <div className="flex min-h-screen bg-paper-dim">
      <AdminSidebar userName={session?.user?.name ?? "Admin"} restaurantSlug={restaurant?.slug} />
      <main className="flex-1 p-4 sm:p-8 lg:ml-64">{children}</main>
    </div>
  );
}
