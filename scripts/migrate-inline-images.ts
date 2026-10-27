import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { sanitizeImage } from "../src/lib/image-security";

const db = new PrismaClient();
async function migrate() {
  const products = await db.product.findMany({ where: { image: { startsWith: "data:image/" } }, select: { id: true, restaurantId: true, image: true } });
  const restaurants = await db.restaurant.findMany({ where: { logoUrl: { startsWith: "data:image/" } }, select: { id: true, logoUrl: true } });
  console.log(JSON.stringify({ inlineProducts: products.length, inlineLogos: restaurants.length, apply: process.argv.includes("--apply") }));
  if (!process.argv.includes("--apply")) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Image store not configured");
  async function upload(value: string, restaurantId: string) {
    const match = /^data:image\/(?:webp|png|jpeg|gif);base64,([A-Za-z0-9+/=]+)$/.exec(value);
    if (!match || match[1].length > 6 * 1024 * 1024) throw new Error("Invalid inline image");
    const image = await sanitizeImage(Buffer.from(match[1], "base64"));
    const digest = createHash("sha256").update(image).digest("hex");
    return (await put(`restaurants/${restaurantId}/migrated-${digest}.webp`, image, {
      access: "public", addRandomSuffix: false, contentType: "image/webp", allowOverwrite: true,
    })).url;
  }
  let migrated = 0;
  for (const product of products) {
    const url = await upload(product.image, product.restaurantId);
    const result = await db.product.updateMany({ where: { id: product.id, image: product.image }, data: { image: url } });
    migrated += result.count;
  }
  for (const restaurant of restaurants) {
    const url = await upload(restaurant.logoUrl!, restaurant.id);
    const result = await db.restaurant.updateMany({ where: { id: restaurant.id, logoUrl: restaurant.logoUrl }, data: { logoUrl: url } });
    migrated += result.count;
  }
  console.log(JSON.stringify({ migratedImages: migrated }));
}
migrate().catch(() => { console.error("Image migration failed; already migrated records remain valid. Rerun after checking configuration."); process.exitCode = 1; }).finally(() => db.$disconnect());
