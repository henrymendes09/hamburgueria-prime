import { Percent } from "lucide-react";

export function PromoBanner({ coupon }: { coupon: { code: string; type: string; value: number } | null }) {
  if (!coupon) return null;

  const label =
    coupon.type === "PERCENTUAL" ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)} OFF`;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="torn-edge torn-edge-bottom relative flex flex-col items-center justify-between gap-4 overflow-hidden bg-flame px-6 py-8 text-center text-white sm:flex-row sm:text-left sm:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Percent className="h-8 w-8" />
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl">{label} no seu primeiro pedido</p>
            <p className="text-sm text-white/80 normal-case mt-1">
              Use o cupom <strong className="font-mono tracking-wider">{coupon.code}</strong> no
              carrinho e economize agora mesmo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
