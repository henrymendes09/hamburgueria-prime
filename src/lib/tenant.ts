import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEFAULT_RESTAURANT_SLUG = "hamburgueria-prime";

export async function getPublicRestaurant() {
  const requestHeaders = await headers();
  const explicitSlug = requestHeaders.get("x-restaurant-slug");
  const slug = explicitSlug || process.env.DEFAULT_RESTAURANT_SLUG || DEFAULT_RESTAURANT_SLUG;
  return prisma.restaurant.findUniqueOrThrow({ where: { slug } });
}

export async function requireRestaurantAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");
  if (!session.user.restaurantId) redirect("/admin/login?error=SEM_EMPRESA");
  return { session, restaurantId: session.user.restaurantId };
}

export async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user?.isPlatformAdmin) redirect("/");
  return session;
}
