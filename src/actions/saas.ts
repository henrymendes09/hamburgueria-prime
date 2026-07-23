"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createMercadoPagoSubscription } from "@/lib/mercado-pago-subscriptions";
import { planPricing } from "@/lib/plan-pricing";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createRestaurantAction(formData: FormData) {
  const name = String(formData.get("restaurantName") || "").trim();
  const ownerName = String(formData.get("ownerName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const planId = String(formData.get("planId") || "");
  const billingCycle = formData.get("billingCycle") === "YEARLY" ? "YEARLY" : "MONTHLY";
  if (name.length < 3 || ownerName.length < 3 || !email.includes("@") || password.length < 8) redirect("/comece?erro=dados");
  if (await prisma.user.findUnique({ where: { email } })) redirect("/comece?erro=email");
  const plan = await prisma.plan.findFirst({
    where: { id: planId, active: true },
    include: { _count: { select: { subscriptions: true } } },
  });
  if (!plan) redirect("/comece?erro=plano");

  const baseSlug = slugify(name) || "hamburgueria";
  let slug = baseSlug;
  for (let suffix = 2; await prisma.restaurant.findUnique({ where: { slug } }); suffix++) slug = `${baseSlug}-${suffix}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date(Date.now() + 14 * 86400000);
  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({ data: { name, slug, email, phone, status: "TRIALING" } });
    await tx.user.create({ data: { name: ownerName, email, phone, passwordHash, role: "ADMIN", restaurantId: restaurant.id } });
    const subscription = await tx.subscription.create({ data: { restaurantId: restaurant.id, planId, billingCycle, status: "TRIALING", trialEndsAt } });
    return { restaurant, subscription };
  });

  const pricing = planPricing(plan, plan._count.subscriptions);
  const amount = billingCycle === "YEARLY" ? pricing.yearly : pricing.monthly;
  try {
    const checkout = await createMercadoPagoSubscription({ subscriptionId: result.subscription.id, restaurantName: name, payerEmail: email, amount, cycle: billingCycle });
    if (checkout) {
      await prisma.subscription.update({ where: { id: result.subscription.id }, data: { providerSubscriptionId: checkout.id, checkoutUrl: checkout.init_point } });
    }
  } catch (error) {
    console.error("Falha ao iniciar assinatura", error);
  }
  redirect(`/comece/sucesso?loja=${encodeURIComponent(result.restaurant.slug)}`);
}
