import { prisma } from "@/lib/prisma";
import { EquipeManager } from "@/components/admin/equipe-manager";

export const metadata = { title: "Equipe" };

export default async function AdminEquipePage() {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "ENTREGADOR"] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <EquipeManager
      staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role }))}
    />
  );
}
