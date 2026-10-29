import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { EntregadorBoard } from "@/components/admin/entregador-board";
import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDriverOrders } from "@/lib/driver-server";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const restaurant = session?.user?.restaurantId
    ? await prisma.restaurant.findUnique({
        where: { id: session.user.restaurantId },
        select: { name: true, slug: true },
      })
    : null;
  if (!restaurant) return { title: "Meus Pedidos" };
  const tenant = encodeURIComponent(restaurant.slug);
  return {
    title: `Entregas | ${restaurant.name}`,
    applicationName: restaurant.name,
    manifest: `/api/pwa/manifest?loja=${tenant}`,
    icons: {
      icon: `/api/pwa/icon?loja=${tenant}`,
      apple: `/api/pwa/icon?loja=${tenant}`,
    },
    appleWebApp: {
      capable: true,
      title: restaurant.name.slice(0, 18),
      statusBarStyle: "black-translucent",
    },
  };
}

export default async function EntregadorPage() {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.blocked ||
    session.user.role !== "ENTREGADOR" ||
    !session.user.restaurantId
  )
    redirect("/entregador/login");
  const [orders, restaurant] = await Promise.all([
    getDriverOrders(session.user.restaurantId, session.user.id),
    prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { name: true, address: true, storeCep: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-paper-dim">
      <header className="flex items-center justify-between bg-ink px-5 py-4 text-paper">
        <div className="flex items-center gap-2">
          <div className="stamp flex h-9 w-9 items-center justify-center rounded-full bg-flame font-display text-sm">
            HP
          </div>
          <div>
            <span className="text-sm font-bold">Área do Entregador</span>
            <p className="text-xs text-white/60">
              {restaurant?.name} · {session.user.name}
            </p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/entregador/login" });
          }}
        >
          <button className="flex items-center gap-1.5 text-xs font-bold uppercase text-paper/70">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </form>
      </header>

      <div className="p-5">
        <EntregadorBoard
          initialOrders={orders}
          storeAddress={
            restaurant?.address
              ? [restaurant.address, restaurant.storeCep, "Brasil"]
                  .filter(Boolean)
                  .join(", ")
              : ""
          }
        />
      </div>
    </div>
  );
}
