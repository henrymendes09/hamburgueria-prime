import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDateTime, ORDER_STATUS_LABEL } from "@/lib/utils";
import { Package } from "lucide-react";
import { getPublicRestaurant } from "@/lib/tenant";

export const metadata = { title: "Meus pedidos" };

const STATUS_VARIANT: Record<string, "default" | "success" | "muted" | "dark"> = {
  RECEBIDO: "muted",
  ACEITO: "default",
  PREPARANDO: "default",
  SAIU_PARA_ENTREGA: "default",
  ENTREGUE: "success",
  CANCELADO: "dark",
  RECUSADO: "dark",
};

export default async function PedidosPage() {
  const session = await auth();
  const restaurant = await getPublicRestaurant();
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id, restaurantId: restaurant.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-ink/5 p-10 text-center">
        <Package className="h-10 w-10 text-ash-light mx-auto mb-3" />
        <p className="text-ash font-semibold">Você ainda não fez nenhum pedido</p>
        <Link href="/cardapio" className="text-flame font-bold text-sm mt-2 inline-block">
          Ver cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/pedido/${order.id}`}
          className="flex items-center justify-between rounded-2xl border-2 border-ink/5 p-5 hover:border-flame/30 hover:shadow-md transition-all"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-base text-ink">Pedido #{order.number}</span>
              <Badge variant={STATUS_VARIANT[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            </div>
            <p className="text-xs text-ash-light normal-case">{formatDateTime(order.createdAt)}</p>
            <p className="text-sm text-ash normal-case mt-1">
              {order.items.length} {order.items.length === 1 ? "item" : "itens"}
            </p>
          </div>
          <span className="font-display text-lg text-flame">{formatMoney(order.total)}</span>
        </Link>
      ))}
    </div>
  );
}
