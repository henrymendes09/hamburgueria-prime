import { prisma } from "@/lib/prisma";
import { requireRestaurantAdmin } from "@/lib/tenant";
import { resolveOperation, operationDefaults } from "@/lib/store-hours";
import { OperationEditor } from "@/components/admin/operation-editor";
export const metadata = { title: "Funcionamento da loja" };
export default async function FuncionamentoPage() {
  const { restaurantId } = await requireRestaurantAdmin();
  const restaurant = await prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
  return <OperationEditor key={restaurant.updatedAt.toISOString()} initialValue={resolveOperation(restaurant.operationSettings) ?? operationDefaults()} configured={Boolean(restaurant.operationSettings)} />;
}
