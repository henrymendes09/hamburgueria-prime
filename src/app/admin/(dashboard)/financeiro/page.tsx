import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FinanceiroManager } from "@/components/admin/financeiro-manager";
import { requireRestaurantAdmin } from "@/lib/tenant";
import { financialPeriod, summarizeFinancialOrders, revenueSeries } from "@/lib/financial-report";
export const metadata = { title: "Relatório financeiro" };
export default async function AdminFinanceiroPage({ searchParams }: { searchParams: Promise<{ de?: string; ate?: string; page?: string }> }) {
  const { restaurantId } = await requireRestaurantAdmin(), params = await searchParams;
  const period = financialPeriod(params.de, params.ate);
  const page = /^\d+$/.test(params.page ?? "") ? Math.max(1, Math.min(10000, Number(params.page))) : 1;
  const where = { restaurantId, createdAt: { gte: period.start, lt: period.end } };
  const [all, orders, count, items] = await Promise.all([
    prisma.order.findMany({ where, select: { createdAt: true, status: true, paymentStatus: true, paymentMethod: true, total: true, subtotal: true, deliveryFee: true, discount: true, deliveryPayout: true, paymentFee: true } }),
    prisma.order.findMany({ where, include: { user: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 50, take: 50 }),
    prisma.order.count({ where }),
    prisma.orderItem.findMany({ where: { order: { ...where, paymentStatus: "PAGO", status: { notIn: ["CANCELADO", "RECUSADO"] } } }, select: { productName: true, quantity: true, unitPrice: true } }),
  ]);
  const products = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of items) { const product = products.get(item.productName) ?? { name: item.productName, qty: 0, revenue: 0 }; product.qty += item.quantity; product.revenue = Math.round((product.revenue + item.quantity * item.unitPrice) * 100) / 100; products.set(product.name, product); }
  const href = (p: number) => `/admin/financeiro?de=${period.from}&ate=${period.to}&page=${p}`;
  return <div className="space-y-5 normal-case"><h1 className="font-display text-3xl">Financeiro</h1><form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 print:hidden"><label className="grid gap-1 text-sm">De<input name="de" type="date" defaultValue={period.from} required className="rounded-lg border p-2" /></label><label className="grid gap-1 text-sm">Até<input name="ate" type="date" defaultValue={period.to} required className="rounded-lg border p-2" /></label><button className="rounded-xl bg-ink px-4 py-2 text-sm text-white">Aplicar período</button></form><p className="text-xs text-ash">Período por data de criação do pedido, no fuso de Brasília. Situação de pagamento atual. Intervalo máximo: 366 dias.</p>{period.invalid && <p role="alert" className="text-sm text-red-600">Período inválido. Exibindo o mês atual.</p>}
    <FinanceiroManager summary={summarizeFinancialOrders(all)} revenue={revenueSeries(all, period.from, period.to)} period={{ from: period.from, to: period.to }} topProducts={[...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)} orders={orders.map(order => ({ id: order.id, number: order.number, customer: order.user.name, status: order.status, paymentStatus: order.paymentStatus, total: order.total, subtotal: order.subtotal, deliveryFee: order.deliveryFee, discount: order.discount, deliveryPayout: order.deliveryPayout, paymentFee: order.paymentFee, paymentMethod: order.paymentMethod, paymentCardBrand: order.paymentCardBrand, deliveryType: order.deliveryType, createdAt: order.createdAt.toISOString() }))} />
    <nav className="flex gap-4 text-sm print:hidden">{page > 1 && <Link href={href(page - 1)}>Anterior</Link>}<span>Página {page} · {count} pedidos no período</span>{page * 50 < count && <Link href={href(page + 1)}>Próxima</Link>}</nav></div>;
}
