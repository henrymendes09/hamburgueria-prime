import { prisma } from "@/lib/prisma";
import { EquipeManager } from "@/components/admin/equipe-manager";
import { requireRestaurantAdmin } from "@/lib/tenant";

export const metadata = { title: "Equipe" };

export default async function AdminEquipePage() {
  const { restaurantId } = await requireRestaurantAdmin();
  const staff = await prisma.user.findMany({
    where: { restaurantId, role: { in: ["ADMIN", "ENTREGADOR"] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <EquipeManager
      staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role }))}
    />
  );
}
