import { createRestaurantAction } from "@/actions/saas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ComecePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const [{ erro }, plans] = await Promise.all([
    searchParams,
    prisma.plan.findMany({ where: { active: true }, orderBy: { monthlyPrice: "asc" } }),
  ]);

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
        <fieldset>
          <legend className="font-semibold">Escolha seu plano</legend>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {plans.map((plan, index) => (
              <label key={plan.id} className="relative cursor-pointer rounded-2xl border-2 border-zinc-200 p-5 has-[:checked]:border-red-600 has-[:checked]:bg-red-50">
                <input type="radio" name="planId" value={plan.id} required defaultChecked={index === 0} className="absolute right-4 top-4 accent-red-600" />
                <strong className="block text-xl">{plan.name}</strong>
                <span className="mt-3 block text-3xl font-black">R$ {plan.monthlyPrice.toFixed(2).replace(".", ",")}</span>
                <span className="text-sm text-zinc-500">por mês</span>
                <p className="mt-4 text-sm text-zinc-700">{plan.maxUsers ? `Até ${plan.maxUsers} usuários da equipe` : "Usuários ilimitados"}</p>
              </label>
            ))}
          </div>
        </fieldset>
        <input type="hidden" name="billingCycle" value="MONTHLY" />
        <button className="rounded-xl bg-red-600 px-6 py-4 font-bold text-white hover:bg-red-700">Criar minha hamburgueria</button>
      </form>
    </div>
  </main>;
}
