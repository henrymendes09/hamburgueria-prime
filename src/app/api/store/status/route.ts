import { getPublicRestaurant } from "@/lib/tenant";
import { storeStatus } from "@/lib/store-hours";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("loja");
  const restaurant = slug && slug.length <= 100 ? await prisma.restaurant.findFirst({ where: { slug, status: { in: ["ACTIVE", "TRIALING"] } }, select: { operationSettings: true } }) : await getPublicRestaurant();
  if (!restaurant) return Response.json({ error: "Loja não encontrada" }, { status: 404 });
  return Response.json(storeStatus(restaurant.operationSettings), { headers: { "Cache-Control": "no-store" } });
}
