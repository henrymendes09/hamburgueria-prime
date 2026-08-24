import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { DollarSign, ShoppingBag, Clock, Users, Eye, UserRoundSearch, MousePointerClick } from "lucide-react";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { TopProductsChart } from "@/components/admin/top-products-chart";
import { DeliveryDriversChart } from "@/components/admin/delivery-drivers-chart";
import { requireRestaurantAdmin } from "@/lib/tenant";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { restaurantId } = await requireRestaurantAdmin();
  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    select: { name: true, slug: true },
  });
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday);
  const dayOfWeek = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
  const deliveryReportStart = startOfWeek < startOfMonth ? startOfWeek : startOfMonth;

  const [ordersToday, ordersInProgress, revenueAgg, customersCount, topProducts, last7DaysOrders, visitsToday, visitorsTodayRows, allVisitorsRows, drivers] =
    await Promise.all([
      prisma.order.count({ where: { restaurantId, createdAt: { gte: startOfToday } } }),
      prisma.order.count({
        where: { restaurantId, status: { in: ["RECEBIDO", "ACEITO", "PREPARANDO", "SAIU_PARA_ENTREGA"] } },
      }),
      prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: startOfToday }, status: { not: "CANCELADO" } },
        _sum: { total: true },
      }),
      prisma.user.count({ where: { restaurantId, role: "CLIENTE" } }),
      prisma.product.findMany({
        where: { restaurantId },
        orderBy: { soldCount: "desc" },
        take: 5,
        select: { name: true, soldCount: true },
      }),
      prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: sevenDaysAgo },
          status: { not: "CANCELADO" },
        },
        select: { createdAt: true, total: true },
      }),
      prisma.siteVisit.count({ where: { restaurantId, createdAt: { gte: startOfToday } } }),
      prisma.siteVisit.groupBy({
        by: ["visitorHash"],
        where: { restaurantId, createdAt: { gte: startOfToday } },
      }),
      prisma.siteVisit.groupBy({ by: ["visitorHash"], where: { restaurantId } }),
      prisma.user.findMany({
        where: { restaurantId, role: "ENTREGADOR" },
        orderBy: { name: "asc" },
        select: {
          name: true,
          deliveries: {
            where: { status: "ENTREGUE", deliveredAt: { gte: deliveryReportStart } },
            select: { deliveredAt: true, deliveryFee: true, deliveryPayout: true },
          },
        },
      }),
    ]);

  const deliverySummary = drivers.map((driver) => {
    const payout = (order: { deliveryPayout: number; deliveryFee: number }) => order.deliveryPayout || order.deliveryFee;
    const monthOrders = driver.deliveries.filter((order) => order.deliveredAt && order.deliveredAt >= startOfMonth);
    const weekOrders = driver.deliveries.filter((order) => order.deliveredAt && order.deliveredAt >= startOfWeek);
    return {
      name: driver.name,
      weekDeliveries: weekOrders.length,
      weekPayout: weekOrders.reduce((total, order) => total + payout(order), 0),
      monthDeliveries: monthOrders.length,
      monthPayout: monthOrders.reduce((total, order) => total + payout(order), 0),
    };
  });

  const days: { date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("pt-BR", { weekday: "short" });
    const dayTotal = last7DaysOrders
      .filter((o) => {
        const od = new Date(o.createdAt);
        od.setHours(0, 0, 0, 0);
        return od.getTime() === d.getTime();
      })
      .reduce((sum, o) => sum + o.total, 0);
    days.push({ date: label, total: dayTotal });
  }

  const stats = [
    { label: "Pedidos hoje", value: ordersToday, icon: ShoppingBag, color: "bg-blue-500" },
    { label: "Em andamento", value: ordersInProgress, icon: Clock, color: "bg-amber-500" },
    { label: "Faturamento hoje", value: formatMoney(revenueAgg._sum.total ?? 0), icon: DollarSign, color: "bg-emerald-500" },
    { label: "Clientes cadastrados", value: customersCount, icon: Users, color: "bg-flame" },
    { label: "Visitantes hoje", value: visitorsTodayRows.length, icon: UserRoundSearch, color: "bg-violet-500" },
    { label: "Visualizações hoje", value: visitsToday, icon: Eye, color: "bg-cyan-500" },
    { label: "Visitantes no total", value: allVisitorsRows.length, icon: MousePointerClick, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="text-ash normal-case mt-1">Visão geral da {restaurant.name}</p>
        <Link href={`/loja/${restaurant.slug}`} target="_blank" className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase text-white">
          Abrir link público da loja
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-5 border-2 border-ink/5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.color} text-white mb-3`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-2xl text-ink">{stat.value}</p>
            <p className="text-xs text-ash-light uppercase font-bold tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 border-2 border-ink/5">
          <h2 className="font-display text-lg text-ink mb-4">Faturamento (últimos 7 dias)</h2>
          <RevenueChart data={days} />
        </div>
        <div className="rounded-2xl bg-white p-6 border-2 border-ink/5">
          <h2 className="font-display text-lg text-ink mb-4">Produtos mais vendidos</h2>
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 border-2 border-ink/5">
        <h2 className="font-display text-lg text-ink mb-1">Entregas e repasses por entregador</h2>
        <p className="mb-4 text-xs normal-case text-ash">Semana atual e mês atual, considerando pedidos concluídos.</p>
        <DeliveryDriversChart data={deliverySummary} />
      </div>

    </div>
  );
}
