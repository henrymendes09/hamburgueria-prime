import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  await requirePlatformAdmin();
  const [restaurants, plans, payments] = await Promise.all([
    prisma.restaurant.findMany({ include: { subscription: { include: { plan: true } }, _count: { select: { users: true, orders: true, products: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.plan.findMany({ include: { _count: { select: { subscriptions: true } } }, orderBy: { monthlyPrice: "asc" } }),
    prisma.subscriptionPayment.findMany({ include: { subscription: { include: { restaurant: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return <main className="min-h-screen bg-zinc-950 px-5 py-10 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between"><div><p className="font-bold text-red-500">PLATAFORMA</p><h1 className="text-4xl font-black">Super Admin</h1></div><Link href="/admin" className="rounded-xl bg-white px-4 py-2 font-bold text-black">Painel da loja</Link></div>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Metric label="Hamburguerias" value={restaurants.length} /><Metric label="Assinaturas ativas" value={restaurants.filter(r => r.subscription?.status === "ACTIVE").length} /><Metric label="Planos" value={plans.length} />
      </section>
      <section className="mt-8 overflow-x-auto rounded-2xl bg-zinc-900 p-6"><h2 className="text-2xl font-bold">Clientes</h2><table className="mt-5 w-full text-left"><thead className="text-zinc-400"><tr><th className="p-3">Empresa</th><th>Plano</th><th>Status</th><th>Usuários</th><th>Pedidos</th><th>Produtos</th></tr></thead><tbody>{restaurants.map(r => <tr key={r.id} className="border-t border-zinc-800"><td className="p-3"><b>{r.name}</b><small className="block text-zinc-500">/{r.slug}</small></td><td>{r.subscription?.plan.name ?? "—"}</td><td>{r.subscription?.status ?? r.status}</td><td>{r._count.users}</td><td>{r._count.orders}</td><td>{r._count.products}</td></tr>)}</tbody></table></section>
      <section className="mt-8 rounded-2xl bg-zinc-900 p-6"><h2 className="text-2xl font-bold">Planos</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{plans.map(p => <div className="rounded-xl border border-zinc-700 p-5" key={p.id}><b>{p.name}</b><p className="mt-2 text-2xl">R$ {p.monthlyPrice.toFixed(2).replace(".", ",")}</p><small>{p._count.subscriptions} assinatura(s)</small></div>)}</div></section>
      <section className="mt-8 rounded-2xl bg-zinc-900 p-6"><h2 className="text-2xl font-bold">Últimos pagamentos</h2>{payments.length === 0 ? <p className="mt-4 text-zinc-400">Nenhuma cobrança processada.</p> : payments.map(p => <p key={p.id} className="border-t border-zinc-800 py-3">{p.subscription.restaurant.name} — R$ {p.amount.toFixed(2)} — {p.status}</p>)}</section>
    </div>
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-zinc-900 p-6"><p className="text-zinc-400">{label}</p><strong className="text-4xl">{value}</strong></div>; }
