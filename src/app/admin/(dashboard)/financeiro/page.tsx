import { prisma } from "@/lib/prisma";
import { FinanceiroManager } from "@/components/admin/financeiro-manager";

export const metadata = { title: "Financeiro" };

export default async function AdminFinanceiroPage() {
  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELADO" } },
    include: { items: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = productSales.get(item.productName) ?? { name: item.productName, qty: 0, revenue: 0 };
      current.qty += item.quantity;
      current.revenue += item.unitPrice * item.quantity;
      productSales.set(item.productName, current);
    }
  }
  const topProducts = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return (
    <FinanceiroManager
      summary={{ totalRevenue, totalOrders, avgTicket }}
      topProducts={topProducts}
      orders={orders.map((o) => ({
        number: o.number,
        customer: o.user.name,
        status: o.status,
        total: o.total,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
