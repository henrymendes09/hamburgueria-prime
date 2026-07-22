import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { DollarSign, ShoppingBag, Clock, Users, Eye, UserRoundSearch, MousePointerClick } from "lucide-react";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { TopProductsChart } from "@/components/admin/top-products-chart";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [ordersToday, ordersInProgress, revenueAgg, customersCount, topProducts, last7DaysOrders, visitsToday, visitorsTodayRows, allVisitorsRows, topPages] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.count({
        where: { status: { in: ["RECEBIDO", "ACEITO", "PREPARANDO", "SAIU_PARA_ENTREGA"] } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfToday }, status: { not: "CANCELADO" } },
        _sum: { total: true },
      }),
      prisma.user.count({ where: { role: "CLIENTE" } }),
      prisma.product.findMany({
        orderBy: { soldCount: "desc" },
        take: 5,
        select: { name: true, soldCount: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { not: "CANCELADO" },
        },
        select: { createdAt: true, total: true },
      }),
      prisma.siteVisit.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.siteVisit.groupBy({
        by: ["visitorHash"],
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.siteVisit.groupBy({ by: ["visitorHash"] }),
      prisma.siteVisit.groupBy({
        by: ["path"],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 5,
      }),
    ]);

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
        <p className="text-ash normal-case mt-1">Visão geral da Hamburgueria Prime</p>
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
        <h2 className="font-display text-lg text-ink mb-4">Páginas mais acessadas (últimos 7 dias)</h2>
        {topPages.length === 0 ? (
          <p className="text-sm text-ash normal-case">As visitas começarão a aparecer aqui após os próximos acessos.</p>
        ) : (
          <div className="space-y-3">
            {topPages.map((page) => (
              <div key={page.path} className="flex items-center justify-between border-b border-ink/5 pb-3 last:border-0">
                <span className="text-sm font-semibold normal-case text-ink">{page.path}</span>
                <span className="text-sm font-bold text-flame">{page._count.path} acessos</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
