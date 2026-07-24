import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const restaurant = session?.user?.restaurantId
    ? await prisma.restaurant.findUnique({ where: { id: session.user.restaurantId }, select: { name: true, slug: true } })
    : null;
  if (!restaurant) return {};
  const tenant = encodeURIComponent(restaurant.slug);
  return {
    applicationName: restaurant.name,
    manifest: `/api/pwa/manifest?loja=${tenant}`,
    icons: { icon: `/api/pwa/icon?loja=${tenant}`, apple: `/api/pwa/icon?loja=${tenant}` },
    appleWebApp: { capable: true, title: restaurant.name.slice(0, 18), statusBarStyle: "black-translucent" },
  };
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const restaurant = session?.user?.restaurantId
    ? await prisma.restaurant.findUnique({ where: { id: session.user.restaurantId }, select: { slug: true, primaryColor: true } })
    : null;
  const primaryColor = restaurant?.primaryColor && /^#[0-9a-fA-F]{6}$/.test(restaurant.primaryColor)
    ? restaurant.primaryColor
    : "#e01b22";

  return (
    <div className="flex min-h-screen bg-paper-dim">
      <style>{`:root{--color-flame:${primaryColor};--color-flame-dark:color-mix(in srgb,${primaryColor} 72%,black);--color-flame-light:color-mix(in srgb,${primaryColor} 72%,white)}`}</style>
      <AdminSidebar userName={session?.user?.name ?? "Admin"} restaurantSlug={restaurant?.slug} />
      <main className="flex-1 p-4 sm:p-8 lg:ml-64">{children}</main>
    </div>
  );
}
