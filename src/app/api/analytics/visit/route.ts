import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPublicRestaurant } from "@/lib/tenant";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const VISITOR_ID_PATTERN = /^[0-9a-f-]{36}$/i;

export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") || 0) > 2048) return NextResponse.json({ ok: false }, { status: 413 });
  const limited = await rateLimit(`analytics:${clientIp(req.headers)}`, { limit: 60, windowMs: 60000 });
  if (!limited.success) return NextResponse.json({ ok: false }, { status: 429 });
  const body = (await req.json().catch(() => null)) as
    | { visitorId?: string; path?: string }
    | null;

  const visitorId = body?.visitorId;
  const path = body?.path;

  if (
    typeof visitorId !== "string" ||
    !VISITOR_ID_PATTERN.test(visitorId) ||
    typeof path !== "string" ||
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

  const restaurant = await getPublicRestaurant();
  await prisma.siteVisit.create({ data: { visitorHash, path, restaurantId: restaurant.id } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
