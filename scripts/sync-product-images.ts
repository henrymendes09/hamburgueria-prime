import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const RESTAURANT_SLUG = "hamburgueria-prime";
const PRODUCTS_DIRECTORY = path.join(process.cwd(), "public", "images", "menu", "products");

async function main() {
  const prisma = new PrismaClient();
  const slugs = fs.readdirSync(PRODUCTS_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".webp"))
    .map((fileName) => path.basename(fileName, ".webp"));

  const results = await prisma.$transaction(
    slugs.map((slug) => prisma.product.updateMany({
      where: { slug, restaurant: { slug: RESTAURANT_SLUG } },
      data: { image: `/images/menu/products/${slug}.webp` },
    })),
  );

  const updated = results.reduce((total, result) => total + result.count, 0);
  await prisma.$disconnect();

  console.log(`Imagens sincronizadas: ${updated}/${slugs.length}`);
  if (updated !== slugs.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
