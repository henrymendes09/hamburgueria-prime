import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("loja")?.trim();
  if (!slug) return NextResponse.redirect(new URL("/pwa-512.png", request.url));

  const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { logoUrl: true } });
  const logo = restaurant?.logoUrl;
  if (!logo) return NextResponse.redirect(new URL("/pwa-512.png", request.url));

  if (logo.startsWith("data:image/")) {
    const match = logo.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return NextResponse.redirect(new URL("/pwa-512.png", request.url));
    return new NextResponse(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  try {
    const destination = new URL(logo, request.nextUrl.origin);
    if (!["http:", "https:"].includes(destination.protocol)) throw new Error("Protocolo inválido");
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect(new URL("/pwa-512.png", request.url));
  }
}
