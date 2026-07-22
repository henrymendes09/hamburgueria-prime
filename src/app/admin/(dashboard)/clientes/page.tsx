import { prisma } from "@/lib/prisma";
import { CustomersManager } from "@/components/admin/customers-manager";
import { requireRestaurantAdmin } from "@/lib/tenant";

export const metadata = { title: "Gestão de Clientes" };

export default async function AdminClientesPage() {
  const { restaurantId } = await requireRestaurantAdmin();
  const customers = await prisma.user.findMany({
    where: { restaurantId, role: "CLIENTE" },
    include: { _count: { select: { orders: true, addresses: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CustomersManager
      customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        blocked: c.blocked,
        lastAccess: c.lastAccess.toISOString(),
        ordersCount: c._count.orders,
        addressesCount: c._count.addresses,
      }))}
    />
  );
}
