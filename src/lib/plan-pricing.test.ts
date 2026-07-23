import { describe, expect, it } from "vitest";
import { planPricing } from "./plan-pricing";

const plan = {
  monthlyPrice: 99.9,
  yearlyPrice: 999,
  launchMonthlyPrice: 79.9,
  launchSlots: 20,
};

describe("planPricing", () => {
  it("aplica o lançamento enquanto houver vagas", () => {
    expect(planPricing(plan, 3)).toMatchObject({
      monthly: 79.9,
      yearly: 799,
      launchAvailable: true,
      remainingLaunchSlots: 17,
    });
  });

  it("usa o preço regular depois das vagas", () => {
    expect(planPricing(plan, 20)).toMatchObject({
      monthly: 99.9,
      yearly: 999,
      launchAvailable: false,
    });
  });

  it("cobra dez mensalidades no plano anual", () => {
    const pricing = planPricing({ ...plan, launchMonthlyPrice: null }, 0);
    expect(pricing.yearly).toBe(pricing.monthly * 10);
  });
});
