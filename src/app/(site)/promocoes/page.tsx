import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/site/product-card";
import { Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CouponCopyButton } from "@/components/site/coupon-copy-button";

export const metadata = {
  title: "Promoções",
  description: "Confira os cupons e produtos em promoção da Hamburgueria Prime.",
};

export default async function PromocoesPage() {
  const [coupons, promoProducts] = await Promise.all([
    prisma.coupon.findMany({
      where: { active: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { available: true, promoPrice: { not: null } },
      include: { addons: { include: { addon: true } }, category: true },
    }),
  ]);

  const productsData = promoProducts.map((p) => ({
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
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-flame">Promoções</span>
        <h1 className="font-display text-4xl text-ink mt-2 sm:text-5xl">Ofertas imperdíveis</h1>
      </div>

      {coupons.length > 0 && (
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between rounded-2xl border-2 border-dashed border-flame bg-flame/5 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-flame text-white">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg text-ink">
                    {coupon.type === "PERCENTUAL" ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)} OFF`}
                  </p>
                  <p className="text-xs text-ash-light normal-case">
                    Válido até {formatDate(coupon.expiresAt)}
                  </p>
                </div>
              </div>
              <CouponCopyButton code={coupon.code} />
            </div>
          ))}
        </div>
      )}

      {productsData.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productsData.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-center text-ash py-10">Nenhum produto em promoção no momento.</p>
      )}
    </div>
  );
}
