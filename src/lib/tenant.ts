import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEFAULT_RESTAURANT_SLUG = "hamburgueria-prime";
export const RESTAURANT_COOKIE = "hp_restaurant";

export async function getPublicRestaurant() {
  const requestHeaders = await headers();
  const explicitSlug = requestHeaders.get("x-restaurant-slug");
  const selectedSlug = (await cookies()).get(RESTAURANT_COOKIE)?.value;
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "").split(":")[0].toLowerCase();
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN?.toLowerCase();
  const hostSlug = rootDomain && host.endsWith(`.${rootDomain}`) ? host.slice(0, -(rootDomain.length + 1)) : null;
  const slug = explicitSlug || hostSlug || selectedSlug || process.env.DEFAULT_RESTAURANT_SLUG || DEFAULT_RESTAURANT_SLUG;
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      status: { in: ["ACTIVE", "TRIALING"] },
      OR: [{ slug }, ...(host ? [{ customDomain: host }] : [])],
    },
  });
  if (restaurant) return restaurant;
  return prisma.restaurant.findUniqueOrThrow({ where: { slug: process.env.DEFAULT_RESTAURANT_SLUG || DEFAULT_RESTAURANT_SLUG } });
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
