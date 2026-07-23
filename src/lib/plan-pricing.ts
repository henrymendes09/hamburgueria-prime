export type PriceablePlan = {
  monthlyPrice: number;
  yearlyPrice: number | null;
  launchMonthlyPrice: number | null;
  launchSlots: number | null;
};

export function planPricing(plan: PriceablePlan, subscriptionsCount: number) {
  const launchAvailable =
    plan.launchMonthlyPrice !== null &&
    plan.launchSlots !== null &&
    subscriptionsCount < plan.launchSlots;
  const monthly = launchAvailable ? plan.launchMonthlyPrice! : plan.monthlyPrice;
  const yearly = launchAvailable
    ? monthly * 10
    : (plan.yearlyPrice ?? plan.monthlyPrice * 10);

  return {
    monthly,
    yearly,
    monthlyEquivalentOnYearly: yearly / 12,
    launchAvailable,
    remainingLaunchSlots: launchAvailable ? plan.launchSlots! - subscriptionsCount : 0,
  };
}
