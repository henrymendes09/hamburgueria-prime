import { auth } from "@/lib/auth";
import { getDriverOrders } from "@/lib/driver-server";
export async function GET() {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.blocked ||
    session.user.role !== "ENTREGADOR" ||
    !session.user.restaurantId
  )
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  return Response.json(
    {
      orders: await getDriverOrders(session.user.restaurantId, session.user.id),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
