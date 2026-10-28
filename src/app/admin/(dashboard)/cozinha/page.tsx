import { requireRestaurantAdmin } from "@/lib/tenant";
import { getKitchenOrders } from "@/lib/kitchen-server";
import { KitchenBoard } from "@/components/admin/kitchen-board";
export const metadata = { title: "Cozinha" };
export default async function KitchenPage() {
  const { restaurantId } = await requireRestaurantAdmin();
  return <KitchenBoard initialOrders={await getKitchenOrders(restaurantId)} />;
}
