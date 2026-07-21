"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Heart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMoney, cn } from "@/lib/utils";
import { ProductCardData } from "@/types/product";
import { ProductModal } from "@/components/site/product-modal";
import { toggleFavoriteAction } from "@/actions/reviews";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProductCard({ product }: { product: ProductCardData }) {
  const [open, setOpen] = useState(false);
  const [favorited, setFavorited] = useState(!!product.isFavorited);
  const { data: session } = useSession();
  const router = useRouter();

  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (!session?.user) {
      toast.info("Faça login para favoritar produtos");
      router.push("/login");
      return;
    }
    setFavorited((v) => !v);
    const result = await toggleFavoriteAction(product.id);
    if (!result.success) {
      setFavorited((v) => !v);
      toast.error(result.message);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!product.available}
        className={cn(
          "group text-left flex flex-col overflow-hidden rounded-2xl bg-white border-2 border-ink/5 hover:border-flame/30 hover:shadow-xl transition-all",
          !product.available && "opacity-60 grayscale cursor-not-allowed"
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 300px"
          />
          {hasPromo && (
            <Badge className="stamp absolute left-3 top-3">Promoção</Badge>
          )}
          {!product.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
              <Badge variant="dark">Indisponível</Badge>
            </div>
          )}
          <button
            onClick={handleFavorite}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-transform hover:scale-110"
            aria-label="Favoritar"
          >
            <Heart className={cn("h-4 w-4", favorited ? "fill-flame text-flame" : "text-ink")} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-1 text-xs text-gold font-semibold mb-1">
            <Star className="h-3.5 w-3.5 fill-gold" /> {product.rating.toFixed(1)}
            <span className="text-ash-light font-normal">· {product.soldCount} vendidos</span>
          </div>
          <h3 className="font-display text-base text-ink leading-tight normal-case">{product.name}</h3>
          <p className="text-xs text-ash mt-1 line-clamp-2 flex-1">{product.description}</p>

          <div className="mt-3 flex items-center justify-between">
            <div>
              {hasPromo ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-ash-light line-through">{formatMoney(product.price)}</span>
                  <span className="font-display text-lg text-flame">{formatMoney(product.promoPrice!)}</span>
                </div>
              ) : (
                <span className="font-display text-lg text-ink">{formatMoney(product.price)}</span>
              )}
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper group-hover:bg-flame transition-colors">
              <Plus className="h-4 w-4" />
            </span>
          </div>
        </div>
      </button>

      <ProductModal product={product} open={open} onOpenChange={setOpen} />
    </>
  );
}
