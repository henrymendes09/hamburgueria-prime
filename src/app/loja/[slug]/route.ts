import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RESTAURANT_COOKIE } from "@/lib/tenant";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, status: { in: ["ACTIVE", "TRIALING"] } },
    select: { slug: true },
  });
  if (!restaurant) return new NextResponse("Hamburgueria não encontrada ou indisponível.", { status: 404 });

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(RESTAURANT_COOKIE, restaurant.slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
