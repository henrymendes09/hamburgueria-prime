import { prisma } from "@/lib/prisma";
import { emailIsConfigured, sendPlainEmail } from "@/lib/recovery-email";

export async function deliverOrderEmails(filter: { restaurantId?: string; orderId?: string; userId?: string } = {}) {
  if (!emailIsConfigured()) return;
  const startedAt = Date.now();
  const now = new Date();
  const candidates = await prisma.orderNotification.findMany({
    where: { ...filter, emailStatus: { in: ["PENDING", "FAILED"] }, emailAttempts: { lt: 3 }, nextAttemptAt: { lte: now }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
    orderBy: { createdAt: "asc" }, take: 8,
  });
  for (const notification of candidates) {
    if (Date.now() - startedAt > 15000) break;
    const claim = await prisma.orderNotification.updateMany({ where: { id: notification.id, emailStatus: { in: ["PENDING", "FAILED"] }, emailAttempts: { lt: 3 }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }] }, data: { lockedUntil: new Date(Date.now() + 120000), emailAttempts: { increment: 1 } } });
    if (!claim.count) continue;
    try {
      const [user, restaurant, order] = await Promise.all([
        prisma.user.findFirst({ where: { id: notification.userId, restaurantId: notification.restaurantId }, select: { email: true, blocked: true } }),
        prisma.restaurant.findUnique({ where: { id: notification.restaurantId }, select: { name: true, slug: true } }),
        prisma.order.findFirst({ where: { id: notification.orderId, userId: notification.userId, restaurantId: notification.restaurantId }, select: { id: true } }),
      ]);
      if (!user?.email || user.blocked || !restaurant || !order || user.email.endsWith(".invalid")) {
        await prisma.orderNotification.update({ where: { id: notification.id }, data: { emailStatus: "SKIPPED", lockedUntil: null } }); continue;
      }
      const origin = new URL(process.env.NEXTAUTH_URL || "https://hamburgueria-prime.vercel.app");
      if (origin.protocol !== "https:" && process.env.NODE_ENV === "production") throw Error("invalid_origin");
      const link = new URL(`/pedido/${notification.orderId}`, origin); link.searchParams.set("loja", restaurant.slug);
      await sendPlainEmail(user.email, `${restaurant.name.replace(/[\r\n]/g, " ")} · Pedido #${notification.orderNumber}: ${notification.title}`, `${notification.message}\n\nAcompanhe seu pedido entrando na sua conta:\n${link}\n\nEsta mensagem é uma atualização do pedido realizado na ${restaurant.name}.`, restaurant.name);
      await prisma.orderNotification.update({ where: { id: notification.id }, data: { emailStatus: "SENT", sentAt: new Date(), lockedUntil: null } });
    } catch {
      await prisma.orderNotification.update({ where: { id: notification.id }, data: { emailStatus: "FAILED", lockedUntil: null, nextAttemptAt: new Date(Date.now() + 5 * 60000) } });
      console.error("order_notification_email_failed", { notificationId: notification.id });
    }
  }
}
