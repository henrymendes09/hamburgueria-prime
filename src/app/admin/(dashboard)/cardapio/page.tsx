import { prisma } from "@/lib/prisma";
import { CardapioManager } from "@/components/admin/cardapio-manager";

export const metadata = { title: "Gestão de Cardápio" };

export default async function AdminCardapioPage() {
  const [products, categories, addons] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, addons: { include: { addon: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.addon.findMany({ orderBy: { name: "asc" } }),
  ]);

  const productsData = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    ingredients: p.ingredients,
    image: p.image,
    price: p.price,
    promoPrice: p.promoPrice,
    available: p.available,
    featured: p.featured,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    addonIds: p.addons.map((pa) => pa.addon.id),
  }));

  return <CardapioManager products={productsData} categories={categories} addons={addons} />;
}
