import { requireRestaurantAdmin } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { resolveSiteContent } from "@/lib/site-content";
import { SiteContentEditor } from "@/components/admin/site-content-editor";

export const metadata = { title: "Conteúdo do site" };
export default async function ConteudoPage() {
  const { restaurantId } = await requireRestaurantAdmin();
  const restaurant = await prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
  return <SiteContentEditor key={restaurant.updatedAt.toISOString()} initialValue={resolveSiteContent(restaurant)} />;
}
