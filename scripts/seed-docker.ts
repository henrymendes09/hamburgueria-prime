import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const url = new URL(process.env.DATABASE_URL ?? "");
if (url.hostname !== "db" || url.pathname !== "/hamburgueria_prime_dev") {
  throw new Error("Este script só pode ser executado no banco de desenvolvimento do Docker.");
}
const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "hamburgueria-prime" },
    update: {},
    create: { name: "Hamburgueria Prime", slug: "hamburgueria-prime", status: "ACTIVE", deliveryFee: 7, freeDeliveryThreshold: 89.9 },
  });
  for (const [email, name, role, password] of [
    ["admin@hamburgueriaprime.com.br", "Administrador Local", "ADMIN", "admin123"],
    ["entregador@hamburgueriaprime.com.br", "Entregador Local", "ENTREGADOR", "entrega123"],
    ["ana-souza@email.com", "Ana Souza", "CLIENTE", "cliente123"],
  ] as const) {
    await prisma.user.upsert({ where: { email }, update: {}, create: {
      email, name, role, passwordHash: await bcrypt.hash(password, 10), restaurantId: restaurant.id,
    } });
  }
  const menu = [
    { category: "Hambúrguer", slug: "hamburguer", icon: "🍔", products: [["Prime Clássico", "prime-classico", 29.9], ["Prime Bacon", "prime-bacon", 34.9], ["Prime Veggie", "prime-veggie", 32.9]] },
    { category: "Bebidas", slug: "bebidas", icon: "🥤", products: [["Sprite lata 350ml", "sprite-lata-350ml", 6.9], ["Suco de laranja natural 400ml", "suco-de-laranja-natural-400ml", 9.9]] },
    { category: "Sobremesas", slug: "sobremesas", icon: "🍰", products: [["Torta de limão", "torta-de-limao", 12.9]] },
  ];
  for (const [order, item] of menu.entries()) {
    const category = await prisma.category.upsert({
      where: { restaurantId_slug: { restaurantId: restaurant.id, slug: item.slug } }, update: {},
      create: { restaurantId: restaurant.id, name: item.category, slug: item.slug, icon: item.icon, order },
    });
    for (const [name, slug, price] of item.products) {
      await prisma.product.upsert({
        where: { restaurantId_slug: { restaurantId: restaurant.id, slug: String(slug) } }, update: {},
        create: { restaurantId: restaurant.id, categoryId: category.id, name: String(name), slug: String(slug), price: Number(price),
          description: "Produto de demonstração para testes locais.", ingredients: "Consulte a composição no cadastro do produto.",
          image: `/images/menu/products/${slug}.webp`, featured: true },
      });
    }
  }
  console.log("Ambiente local preparado. Dados existentes foram preservados.");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
