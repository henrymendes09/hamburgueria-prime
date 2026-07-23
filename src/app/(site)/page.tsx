import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Hero } from "@/components/site/hero";
import { CategoryStrip } from "@/components/site/category-strip";
import { PromoBanner } from "@/components/site/promo-banner";
import { Testimonials } from "@/components/site/testimonials";
import { MapSection } from "@/components/site/map-section";
import { ProductCard } from "@/components/site/product-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPublicRestaurant } from "@/lib/tenant";

export default async function HomePage() {
  const session = await auth();
  const restaurant = await getPublicRestaurant();

  const [featured, coupon, reviews, favorites] = await Promise.all([
    prisma.product.findMany({
      where: { restaurantId: restaurant.id, featured: true, available: true },
      include: { addons: { include: { addon: true } }, category: true },
      take: 8,
      orderBy: { soldCount: "desc" },
    }),
    prisma.coupon.findFirst({
      where: { restaurantId: restaurant.id, active: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { productId: null, user: { restaurantId: restaurant.id } },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    session?.user
      ? prisma.favorite.findMany({ where: { userId: session.user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.productId));

  const featuredData = featured.map((p) => ({
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

  return (
    <>
      <Hero />
      <CategoryStrip />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-flame">Mais pedidos</span>
            <h2 className="font-display text-3xl text-ink mt-2 sm:text-4xl">Destaques da casa</h2>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/cardapio">Ver tudo</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featuredData.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Button asChild variant="outline">
            <Link href="/cardapio">Ver cardápio completo</Link>
          </Button>
        </div>
      </section>

      <div className="py-8">
        <PromoBanner coupon={coupon} />
      </div>

      <Testimonials reviews={reviews} />
      <MapSection name={restaurant.name} address={restaurant.address} phone={restaurant.phone} businessHours={restaurant.businessHours} primaryColor={restaurant.primaryColor} />
    </>
  );
}
