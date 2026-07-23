import { describe, expect, it } from "vitest";
import { planPricing } from "./plan-pricing";

const plan = {
  monthlyPrice: 99.9,
  yearlyPrice: 999,
  launchMonthlyPrice: 79.9,
  launchSlots: 20,
};

describe("planPricing", () => {
  it("usa o preço padrão mesmo quando existirem dados promocionais antigos", () => {
    expect(planPricing(plan)).toMatchObject({
      monthly: 99.9,
      yearly: 999,
      launchAvailable: false,
    });
  });

  it("cobra dez mensalidades no plano anual", () => {
    const pricing = planPricing(plan);
    expect(pricing.yearly).toBe(pricing.monthly * 10);
  });
});
