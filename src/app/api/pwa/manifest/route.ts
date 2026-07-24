import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("loja")?.trim();
  if (!slug) return NextResponse.json({ error: "Hamburgueria não informada." }, { status: 400 });

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, slug: true, description: true, primaryColor: true, updatedAt: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Hamburgueria não encontrada." }, { status: 404 });

  const iconBase = `/api/pwa/icon?loja=${encodeURIComponent(restaurant.slug)}&v=${restaurant.updatedAt.getTime()}`;
  const icon192 = `${iconBase}&size=192`;
  const icon512 = `${iconBase}&size=512`;
  const maskable512 = `${iconBase}&size=512&maskable=1`;
  const storeUrl = `/loja/${encodeURIComponent(restaurant.slug)}`;
  const manifest = {
    id: storeUrl,
    name: restaurant.name,
    short_name: restaurant.name.slice(0, 18),
    description: restaurant.description || `Peça online na ${restaurant.name}.`,
    start_url: `${storeUrl}?origem=pwa`,
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0e0d0c",
    theme_color: restaurant.primaryColor,
    categories: ["food", "business", "shopping"],
    lang: "pt-BR",
    icons: [
      { src: icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: maskable512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Fazer pedido", short_name: "Pedir", url: storeUrl, icons: [{ src: icon192, sizes: "192x192", type: "image/png" }] },
      { name: "Painel da hamburgueria", short_name: "Painel", url: "/admin", icons: [{ src: icon192, sizes: "192x192", type: "image/png" }] },
      { name: "Área do entregador", short_name: "Entregas", url: "/entregador", icons: [{ src: icon192, sizes: "192x192", type: "image/png" }] },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
      "Content-Type": "application/manifest+json; charset=utf-8",
    },
  });
}
