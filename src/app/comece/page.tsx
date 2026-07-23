import { createRestaurantAction } from "@/actions/saas";
import { PlanSelector } from "@/components/platform/plan-selector";
import { prisma } from "@/lib/prisma";
import { planPricing } from "@/lib/plan-pricing";

export const dynamic = "force-dynamic";

export default async function ComecePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const [{ erro }, plans] = await Promise.all([
    searchParams,
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { monthlyPrice: "asc" },
    }),
  ]);
  const planOptions = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    maxUsers: plan.maxUsers,
    features: plan.features,
    ...planPricing(plan),
  }));

  return <main className="min-h-screen bg-[#f6f2ea] px-5 py-12 text-zinc-950">
    <div className="mx-auto max-w-5xl">
      <p className="font-bold text-red-600">HAMBURGUERIA PRIME</p>
      <h1 className="mt-2 text-4xl font-black">Crie sua hamburgueria online</h1>
      <p className="mt-3 text-zinc-600">14 dias para testar. Seus clientes, pedidos e cardápio ficam isolados dos demais estabelecimentos.</p>
      {erro && <p className="mt-6 rounded-xl bg-red-100 p-4 text-red-700">Confira os dados. O e-mail pode já estar cadastrado.</p>}
      <form action={createRestaurantAction} className="mt-8 grid gap-5 rounded-3xl bg-white p-7 shadow-sm">
        <label className="grid gap-2 font-semibold">Nome da hamburgueria<input required minLength={3} name="restaurantName" className="rounded-xl border p-3 font-normal" /></label>
        <label className="grid gap-2 font-semibold">Seu nome<input required minLength={3} name="ownerName" className="rounded-xl border p-3 font-normal" /></label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 font-semibold">E-mail<input required type="email" name="email" className="rounded-xl border p-3 font-normal" /></label>
          <label className="grid gap-2 font-semibold">Telefone<input required name="phone" className="rounded-xl border p-3 font-normal" /></label>
        </div>
        <label className="grid gap-2 font-semibold">Senha<input required minLength={8} type="password" name="password" className="rounded-xl border p-3 font-normal" /></label>
        <PlanSelector plans={planOptions} />
        <button className="rounded-xl bg-red-600 px-6 py-4 font-bold text-white hover:bg-red-700">Criar minha hamburgueria</button>
      </form>
    </div>
  </main>;
}
