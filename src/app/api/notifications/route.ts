import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { after } from "next/server";
import { deliverOrderEmails } from "@/lib/order-notifications";
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || !session.user.restaurantId) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const where = { userId: session.user.id, restaurantId: session.user.restaurantId };
  const [unread, items] = await Promise.all([
    prisma.orderNotification.count({ where: { ...where, read: false } }),
    prisma.orderNotification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 30, select: { id: true, orderId: true, orderNumber: true, title: true, message: true, read: true, createdAt: true, restaurant: { select: { slug: true } } } }),
  ]);
  after(() => deliverOrderEmails(where));
  return Response.json({ unread, items }, { headers: { "Cache-Control": "private, no-store" } });
}
