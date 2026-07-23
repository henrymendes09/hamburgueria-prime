import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant";
import { setRestaurantStatusAction, updatePlanAction } from "@/actions/platform";

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
        <Metric label="Hamburguerias" value={restaurants.length} /><Metric label="Assinaturas ativas" value={restaurants.filter((restaurant) => restaurant.subscription?.status === "ACTIVE").length} /><Metric label="Planos" value={plans.length} />
      </section>
      <section className="mt-8 overflow-x-auto rounded-2xl bg-zinc-900 p-6"><h2 className="text-2xl font-bold">Clientes</h2><table className="mt-5 w-full text-left"><thead className="text-zinc-400"><tr><th className="p-3">Empresa</th><th>Plano</th><th>Status</th><th>Usuários</th><th>Pedidos</th><th>Produtos</th><th>Ação</th></tr></thead><tbody>{restaurants.map((restaurant) => <tr key={restaurant.id} className="border-t border-zinc-800"><td className="p-3"><b>{restaurant.name}</b><small className="block text-zinc-500">/{restaurant.slug}</small></td><td>{restaurant.subscription?.plan.name ?? "—"}</td><td>{restaurant.status}</td><td>{restaurant._count.users}</td><td>{restaurant._count.orders}</td><td>{restaurant._count.products}</td><td><form action={setRestaurantStatusAction}><input type="hidden" name="id" value={restaurant.id} /><input type="hidden" name="status" value={restaurant.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} /><button className="rounded-lg border border-zinc-600 px-3 py-2 text-xs">{restaurant.status === "SUSPENDED" ? "Ativar" : "Suspender"}</button></form></td></tr>)}</tbody></table></section>
      <section className="mt-8 rounded-2xl bg-zinc-900 p-6">
        <h2 className="text-2xl font-bold">Planos</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">{plans.map((plan) =>
          <form action={updatePlanAction} className="rounded-xl border border-zinc-700 p-5" key={plan.id}>
            <input type="hidden" name="id" value={plan.id} /><b>{plan.name}</b>
            <PlanField label="Preço mensal" name="monthlyPrice" value={plan.monthlyPrice} />
            <PlanField label="Preço anual" name="yearlyPrice" value={plan.yearlyPrice ?? plan.monthlyPrice * 10} />
            <PlanField label="Limite de usuários (vazio = ilimitado)" name="maxUsers" value={plan.maxUsers ?? ""} step="1" />
            <label className="mt-3 block text-xs text-zinc-400">Funcionalidades (uma por linha)<textarea name="features" defaultValue={plan.features.join("\n")} className="mt-1 min-h-36 w-full rounded-lg bg-zinc-800 p-2 text-white" /></label>
            <small className="mt-3 block">{plan._count.subscriptions} assinatura(s)</small>
            <button className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black">Salvar plano</button>
          </form>)}</div>
      </section>
      <section className="mt-8 rounded-2xl bg-zinc-900 p-6"><h2 className="text-2xl font-bold">Últimos pagamentos</h2>{payments.length === 0 ? <p className="mt-4 text-zinc-400">Nenhuma cobrança processada.</p> : payments.map((payment) => <p key={payment.id} className="border-t border-zinc-800 py-3">{payment.subscription.restaurant.name} — R$ {payment.amount.toFixed(2)} — {payment.status}</p>)}</section>
    </div>
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-zinc-900 p-6"><p className="text-zinc-400">{label}</p><strong className="text-4xl">{value}</strong></div>;
}

function PlanField({ label, name, value, step = "0.01" }: { label: string; name: string; value: string | number; step?: string }) {
  return <label className="mt-3 block text-xs text-zinc-400">{label}<input name={name} type="number" min="0" step={step} defaultValue={value} className="mt-1 w-full rounded-lg bg-zinc-800 p-2 text-white" /></label>;
}
