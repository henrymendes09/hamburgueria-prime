import { prisma } from "@/lib/prisma";
import { CouponsManager } from "@/components/admin/coupons-manager";

export const metadata = { title: "Gestão de Cupons" };

export default async function AdminCuponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return <CouponsManager coupons={JSON.parse(JSON.stringify(coupons))} />;
}
