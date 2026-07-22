import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/tenant";

const VISITOR_ID_PATTERN = /^[0-9a-f-]{36}$/i;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { visitorId?: string; path?: string }
    | null;

  const visitorId = body?.visitorId;
  const path = body?.path;

  if (
    !visitorId ||
    !VISITOR_ID_PATTERN.test(visitorId) ||
    !path ||
    !path.startsWith("/") ||
    path.length > 200 ||
    path.startsWith("/admin") ||
    path.startsWith("/api")
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const visitorHash = crypto
    .createHmac("sha256", process.env.AUTH_SECRET ?? "prime-analytics")
    .update(visitorId)
    .digest("hex");

  const restaurant = await prisma.restaurant.findUnique({ where: { slug: process.env.DEFAULT_RESTAURANT_SLUG || DEFAULT_RESTAURANT_SLUG }, select: { id: true } });
  if (!restaurant) return NextResponse.json({ ok: false }, { status: 404 });
  await prisma.siteVisit.create({ data: { visitorHash, path, restaurantId: restaurant.id } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
