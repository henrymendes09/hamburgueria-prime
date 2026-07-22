import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductCard } from "@/components/site/product-card";
import { ProductCardData } from "@/types/product";
import { MenuSearch } from "@/components/site/menu-search";
import { getPublicRestaurant } from "@/lib/tenant";

export const metadata = {
  title: "Cardápio",
  description: "Confira o cardápio completo da Hamburgueria Prime: hambúrgueres, combos, batatas, bebidas e sobremesas.",
};

export default async function CardapioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>;
}) {
  const { categoria, busca } = await searchParams;
  const session = await auth();
  const restaurant = await getPublicRestaurant();

  const [categories, products, favorites] = await Promise.all([
    prisma.category.findMany({ where: { restaurantId: restaurant.id }, orderBy: { order: "asc" } }),
    prisma.product.findMany({
      where: { restaurantId: restaurant.id, ...(busca ? { name: { contains: busca } } : {}) },
      include: { addons: { include: { addon: true } }, category: true },
      orderBy: { name: "asc" },
    }),
    session?.user
      ? prisma.favorite.findMany({ where: { userId: session.user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.productId));

  const productsData = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    ingredients: p.ingredients,
    image: p.image,
    price: p.price,
    promoPrice: p.promoPrice,
    available: p.available,
    featured: p.featured,
    rating: p.rating,
    soldCount: p.soldCount,
    categoryId: p.categoryId,
    category: { name: p.category.name, slug: p.category.slug },
    addons: p.addons.map((pa) => ({
      id: pa.addon.id,
      name: pa.addon.name,
      price: pa.addon.price,
      type: pa.addon.type,
    })),
    isFavorited: favoriteIds.has(p.id),
  }));

  const defaultTab = categoria && categories.some((c) => c.slug === categoria) ? categoria : "todos";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-flame">Cardápio</span>
        <h1 className="font-display text-4xl text-ink mt-2 sm:text-5xl">Monte seu pedido</h1>
        <p className="text-ash normal-case mt-2 max-w-lg mx-auto">
          Tudo feito na hora, do jeito que você quiser. Personalize ingredientes e adicionais.
        </p>
      </div>

      <Suspense fallback={null}>
        <MenuSearch defaultValue={busca} />
      </Suspense>

      <Tabs defaultValue={defaultTab} className="mt-6">
        <TabsList className="mb-8 flex-wrap justify-center">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.slug}>
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todos">
          <ProductGrid products={productsData} />
        </TabsContent>
        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.slug}>
            <ProductGrid products={productsData.filter((p) => p.category?.slug === cat.slug)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return <p className="text-center text-ash py-16">Nenhum produto encontrado.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
