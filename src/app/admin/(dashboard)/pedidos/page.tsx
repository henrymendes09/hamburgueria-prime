import { prisma } from "@/lib/prisma";
import { OrdersBoard } from "@/components/admin/orders-board";

export const metadata = { title: "Gestão de Pedidos" };

export default async function AdminPedidosPage() {
  const [orders, entregadores] = await Promise.all([
    prisma.order.findMany({
      where: { status: { notIn: ["ENTREGUE", "CANCELADO", "RECUSADO"] } },
      include: {
        items: true,
        user: { select: { name: true, phone: true } },
        address: true,
        entregador: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({ where: { role: "ENTREGADOR" }, select: { id: true, name: true } }),
  ]);

  return <OrdersBoard initialOrders={JSON.parse(JSON.stringify(orders))} entregadores={entregadores} />;
}
