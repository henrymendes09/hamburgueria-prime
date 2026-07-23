import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [orders, products, coupons, users] = await Promise.all([
    prisma.order.findMany({ select: { id: true, restaurantId: true, user: { select: { restaurantId: true } } } }),
    prisma.product.findMany({ select: { id: true, restaurantId: true, category: { select: { restaurantId: true } } } }),
    prisma.coupon.findMany({ select: { id: true, restaurantId: true, orders: { select: { restaurantId: true } } } }),
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "ENTREGADOR"] } }, select: { id: true, restaurantId: true } }),
  ]);
  const problems = [
    ...orders.filter(item => item.restaurantId !== item.user.restaurantId).map(item => `pedido:${item.id}`),
    ...products.filter(item => item.restaurantId !== item.category.restaurantId).map(item => `produto:${item.id}`),
    ...coupons.flatMap(item => item.orders.filter(order => order.restaurantId !== item.restaurantId).map(() => `cupom:${item.id}`)),
    ...users.filter(item => !item.restaurantId).map(item => `equipe:${item.id}`),
  ];
  if (problems.length) throw new Error(`Falhas de isolamento: ${problems.join(", ")}`);
  console.log(`Auditoria aprovada: ${orders.length} pedidos, ${products.length} produtos e ${users.length} usuários de equipe.`);
}

main().finally(() => prisma.$disconnect());
