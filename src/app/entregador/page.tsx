import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { EntregadorBoard } from "@/components/admin/entregador-board";
import { LogOut } from "lucide-react";

export const metadata = { title: "Meus Pedidos" };

export default async function EntregadorPage() {
  const session = await auth();

  const orders = await prisma.order.findMany({
    where: { entregadorId: session!.user.id, restaurantId: session!.user.restaurantId ?? undefined, status: { in: ["PREPARANDO", "SAIU_PARA_ENTREGA"] } },
    include: { items: true, user: { select: { name: true, phone: true } }, address: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-paper-dim">
      <header className="flex items-center justify-between bg-ink px-5 py-4 text-paper">
        <div className="flex items-center gap-2">
          <div className="stamp flex h-9 w-9 items-center justify-center rounded-full bg-flame font-display text-sm">
            HP
          </div>
          <span className="font-display text-sm">Área do Entregador</span>
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
        <EntregadorBoard initialOrders={JSON.parse(JSON.stringify(orders))} />
      </div>
    </div>
  );
}
