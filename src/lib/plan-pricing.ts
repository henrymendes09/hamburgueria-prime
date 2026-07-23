export type PriceablePlan = {
  monthlyPrice: number;
  yearlyPrice: number | null;
  launchMonthlyPrice: number | null;
  launchSlots: number | null;
};

export function planPricing(plan: PriceablePlan) {
  const monthly = plan.monthlyPrice;
  const yearly = plan.yearlyPrice ?? plan.monthlyPrice * 10;

  return {
    monthly,
    yearly,
    monthlyEquivalentOnYearly: yearly / 12,
    launchAvailable: false,
    remainingLaunchSlots: 0,
  };
}
