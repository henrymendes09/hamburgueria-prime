import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProductCard } from "@/components/site/product-card";
import { Heart } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const session = await auth();
  const favorites = await prisma.favorite.findMany({
    where: { userId: session!.user.id },
    include: { product: { include: { addons: { include: { addon: true } }, category: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-ink/5 p-10 text-center">
        <Heart className="h-10 w-10 text-ash-light mx-auto mb-3" />
        <p className="text-ash font-semibold">Nenhum produto favoritado ainda</p>
        <Link href="/cardapio" className="text-flame font-bold text-sm mt-2 inline-block">
          Ver cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {favorites.map((fav) => (
        <ProductCard
          key={fav.id}
          product={{
            id: fav.product.id,
            name: fav.product.name,
            slug: fav.product.slug,
            description: fav.product.description,
            ingredients: fav.product.ingredients,
            image: fav.product.image,
            price: fav.product.price,
            promoPrice: fav.product.promoPrice,
            available: fav.product.available,
            featured: fav.product.featured,
            rating: fav.product.rating,
            soldCount: fav.product.soldCount,
            categoryId: fav.product.categoryId,
            category: { name: fav.product.category.name, slug: fav.product.category.slug },
            addons: fav.product.addons.map((pa) => ({
              id: pa.addon.id,
              name: pa.addon.name,
              price: pa.addon.price,
              type: pa.addon.type,
            })),
            isFavorited: true,
          }}
        />
      ))}
    </div>
  );
}
