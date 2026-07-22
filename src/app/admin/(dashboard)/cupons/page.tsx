import { prisma } from "@/lib/prisma";
import { requireRestaurantAdmin } from "@/lib/tenant";
import { CouponsManager } from "@/components/admin/coupons-manager";

export const metadata = { title: "Gestão de Cupons" };

export default async function AdminCuponsPage() {
  const { restaurantId } = await requireRestaurantAdmin();
  const coupons = await prisma.coupon.findMany({ where: { restaurantId }, orderBy: { createdAt: "desc" } });
  return <CouponsManager coupons={JSON.parse(JSON.stringify(coupons))} />;
}
