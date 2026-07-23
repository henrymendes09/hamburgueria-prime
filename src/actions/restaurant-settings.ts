"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRestaurantAdmin } from "@/lib/tenant";

const settingsSchema = z.object({
  name: z.string().trim().min(3).max(80),
  logoUrl: z.union([
    z.string().trim().url(),
    z.string().trim().startsWith("/"),
    z.string().trim().startsWith("data:image/"),
    z.literal(""),
  ]),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  description: z.string().trim().max(300),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email().or(z.literal("")),
  cnpj: z.string().trim().max(30),
  address: z.string().trim().max(200),
  businessHours: z.string().trim().max(200),
  pixKey: z.string().trim().max(100),
  customDomain: z.string().trim().toLowerCase().max(253),
  deliveryFee: z.coerce.number().min(0).max(1000),
  freeDeliveryThreshold: z.union([z.coerce.number().positive(), z.literal("")]),
});

export async function updateRestaurantSettingsAction(formData: FormData) {
  const { restaurantId } = await requireRestaurantAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/configuracoes?erro=dados");
  const data = parsed.data;
  try {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...data,
        logoUrl: data.logoUrl || null,
        email: data.email || null,
        customDomain: data.customDomain.replace(/^https?:\/\//, "").replace(/\/$/, "") || null,
        freeDeliveryThreshold: data.freeDeliveryThreshold === "" ? null : data.freeDeliveryThreshold,
      },
    });
  } catch {
    redirect("/admin/configuracoes?erro=dominio");
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes?salvo=1");
}
