"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type PlanOption = {
  id: string;
  name: string;
  description: string | null;
  maxUsers: number | null;
  features: string[];
  monthly: number;
  yearly: number;
  monthlyEquivalentOnYearly: number;
};

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PlanSelector({ plans }: { plans: PlanOption[] }) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  return (
    <fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <legend className="font-semibold">Escolha seu plano</legend>
        <div className="flex rounded-full bg-zinc-100 p-1 text-sm font-bold">
          <button type="button" onClick={() => setBillingCycle("MONTHLY")} className={`rounded-full px-4 py-2 ${billingCycle === "MONTHLY" ? "bg-white shadow" : ""}`}>
            Mensal
          </button>
          <button type="button" onClick={() => setBillingCycle("YEARLY")} className={`rounded-full px-4 py-2 ${billingCycle === "YEARLY" ? "bg-emerald-600 text-white shadow" : ""}`}>
            Anual · 2 meses grátis
          </button>
        </div>
      </div>
      <input type="hidden" name="billingCycle" value={billingCycle} />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {plans.map((plan, index) => {
          const displayedPrice = billingCycle === "YEARLY" ? plan.monthlyEquivalentOnYearly : plan.monthly;
          return (
            <label key={plan.id} className="relative cursor-pointer rounded-2xl border-2 border-zinc-200 p-5 has-[:checked]:border-red-600 has-[:checked]:bg-red-50">
              <input type="radio" name="planId" value={plan.id} required defaultChecked={index === 0} className="absolute right-4 top-4 accent-red-600" />
              <strong className="block text-xl">{plan.name}</strong>
              {plan.description && <p className="mt-1 min-h-10 text-sm text-zinc-500">{plan.description}</p>}
              <span className="mt-4 block text-3xl font-black">{money(displayedPrice)}</span>
              <span className="text-sm text-zinc-500">por mês{billingCycle === "YEARLY" ? ` · ${money(plan.yearly)} ao ano` : ""}</span>
              <p className="mt-4 text-sm font-bold">{plan.maxUsers ? `Até ${plan.maxUsers} usuários da equipe` : "Usuários ilimitados"}</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}
              </ul>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
