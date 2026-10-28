import { auth } from "@/lib/auth";
import { getKitchenOrders } from "@/lib/kitchen-server";
export async function GET() {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.blocked ||
    session.user.role !== "ADMIN" ||
    !session.user.restaurantId
  )
    return Response.json({ message: "Não autorizado" }, { status: 401 });
  return Response.json(
    { orders: await getKitchenOrders(session.user.restaurantId) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
