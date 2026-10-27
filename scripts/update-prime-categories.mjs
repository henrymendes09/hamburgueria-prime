import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
try {
  const restaurant = await db.restaurant.findUniqueOrThrow({ where: { slug: "hamburgueria-prime" }, select: { id: true } });
  const result = await db.$transaction([
    db.category.updateMany({ where: { restaurantId: restaurant.id, slug: "batatas", name: "Batatas" }, data: { name: "Porções" } }),
    db.category.updateMany({ where: { restaurantId: restaurant.id, slug: "combos", icon: "🍟" }, data: { icon: "🍔🥤🍟" } }),
    db.category.updateMany({ where: { restaurantId: restaurant.id, slug: "batatas", icon: "🥔" }, data: { icon: "🍟" } }),
  ]);
  console.log(JSON.stringify({ renamedCategories: result[0].count, updatedComboIcons: result[1].count, updatedPortionIcons: result[2].count }));
} finally {
  await db.$disconnect();
}
