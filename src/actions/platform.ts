"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant";

export async function setRestaurantStatusAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["ACTIVE", "SUSPENDED"].includes(status)) return;
  await prisma.restaurant.update({ where: { id }, data: { status: status as "ACTIVE" | "SUSPENDED" } });
  revalidatePath("/super-admin");
}

export async function updatePlanAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") || "");
  const monthlyPrice = Number(formData.get("monthlyPrice"));
  const yearlyPrice = Number(formData.get("yearlyPrice"));
  const rawLaunchPrice = String(formData.get("launchMonthlyPrice") || "");
  const rawLaunchSlots = String(formData.get("launchSlots") || "");
  const rawMaxUsers = String(formData.get("maxUsers") || "");
  if (!id || !Number.isFinite(monthlyPrice) || monthlyPrice <= 0) return;
  const features = String(formData.get("features") || "").split("\n").map((feature) => feature.trim()).filter(Boolean);
  await prisma.plan.update({
    where: { id },
    data: {
      monthlyPrice,
      yearlyPrice: Number.isFinite(yearlyPrice) && yearlyPrice > 0 ? yearlyPrice : monthlyPrice * 10,
      launchMonthlyPrice: rawLaunchPrice ? Number(rawLaunchPrice) : null,
      launchSlots: rawLaunchSlots ? Number(rawLaunchSlots) : null,
      maxUsers: rawMaxUsers ? Number(rawMaxUsers) : null,
      features,
    },
  });
  revalidatePath("/super-admin");
  revalidatePath("/comece");
}
