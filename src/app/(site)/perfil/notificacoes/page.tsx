import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NotificationList } from "@/components/site/notification-list";
export const metadata = { title: "Notificações dos pedidos" };
export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || !session.user.restaurantId) redirect("/login");
  const items = await prisma.orderNotification.findMany({ where: { userId: session.user.id, restaurantId: session.user.restaurantId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, orderId: true, title: true, message: true, read: true, createdAt: true, restaurant: { select: { slug: true } } } });
  return <NotificationList items={items.map(item => ({ ...item, restaurantSlug: item.restaurant.slug, createdAt: item.createdAt.toISOString() }))} />;
}
