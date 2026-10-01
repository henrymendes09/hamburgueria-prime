import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { sanitizeImage } from "@/lib/image-security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("loja")?.trim();
  if (!slug || slug.length > 120) return NextResponse.redirect(new URL("/pwa-512.png", request.url));

  const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { logoUrl: true } });
  const logo = restaurant?.logoUrl;
  if (!logo) return NextResponse.redirect(new URL("/pwa-512.png", request.url));

  if (logo.startsWith("data:image/")) {
    const match = logo.length <= 6 * 1024 * 1024 ? logo.match(/^data:image\/(?:jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/) : null;
    if (!match) return NextResponse.redirect(new URL("/pwa-512.png", request.url));
    const requestedSize = Number(request.nextUrl.searchParams.get("size"));
    const size = requestedSize === 192 ? 192 : 512;
    const maskable = request.nextUrl.searchParams.get("maskable") === "1";
    const contentSize = Math.round(size * (maskable ? 0.66 : 0.9));
    try {
    const foreground = await sharp(await sanitizeImage(Buffer.from(match[1], "base64")))
      .resize(contentSize, contentSize, { fit: "contain", background: { r: 14, g: 13, b: 12, alpha: 0 } })
      .png()
      .toBuffer();
    const icon = await sharp({
      create: { width: size, height: size, channels: 4, background: "#0e0d0c" },
    })
      .composite([{ input: foreground, gravity: "centre" }])
      .png()
      .toBuffer();
    return new NextResponse(new Uint8Array(icon), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    } catch { return NextResponse.redirect(new URL("/pwa-512.png", request.url)); }
  }

  try {
    const destination = new URL(logo, request.nextUrl.origin);
    if (!["http:", "https:"].includes(destination.protocol)) throw new Error("Protocolo inválido");
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect(new URL("/pwa-512.png", request.url));
  }
}
