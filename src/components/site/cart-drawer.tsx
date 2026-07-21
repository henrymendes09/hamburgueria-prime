"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Tag, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore, cartSubtotal, itemPrice } from "@/lib/cart-store";
import { formatMoney } from "@/lib/utils";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/lib/validations";
import { validateCouponAction } from "@/actions/coupons";
import { toast } from "sonner";

export function CartDrawer() {
  const { isOpen, close, items, removeItem, updateQuantity, coupon, applyCoupon, removeCoupon } =
    useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const subtotal = cartSubtotal(items);
  const deliveryFee = items.length === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const discount = coupon
    ? coupon.type === "PERCENTUAL"
      ? (subtotal * coupon.value) / 100
      : Math.min(coupon.value, subtotal)
    : 0;
  const total = Math.max(subtotal + deliveryFee - discount, 0);

  function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    startTransition(async () => {
      const result = await validateCouponAction(couponInput, subtotal);
      if (result.success) {
        applyCoupon(result.coupon);
        toast.success(`Cupom ${result.coupon.code} aplicado!`);
        setCouponInput("");
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCheckout() {
    close();
    router.push("/checkout");
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-ash-light" />
            <p className="text-ash font-semibold">Seu carrinho está vazio</p>
            <p className="text-sm text-ash-light">Adicione itens do cardápio para começar seu pedido.</p>
            <Button asChild className="mt-2">
              <Link href="/cardapio" onClick={close}>Ver cardápio</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-3 border-b border-ink/5 pb-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm text-ink leading-tight">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-ash-light hover:text-flame shrink-0"
                        aria-label="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-ash-light mt-0.5">+ {item.addons.map((a) => a.name).join(", ")}</p>
                    )}
                    {item.removedIngredients.length > 0 && (
                      <p className="text-xs text-ash-light">Sem {item.removedIngredients.join(", ")}</p>
                    )}
                    {item.notes && <p className="text-xs italic text-ash-light">&ldquo;{item.notes}&rdquo;</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 rounded-full border-2 border-ink/10">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 disabled:opacity-30"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="p-1.5"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-bold text-sm text-flame">{formatMoney(itemPrice(item))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-ink/5 px-6 py-4 space-y-3 bg-white">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <Tag className="h-4 w-4" /> {coupon.code}
                  </span>
                  <button onClick={removeCoupon} className="text-emerald-700 underline text-xs">
                    remover
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Cupom de desconto"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="h-9 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleApplyCoupon} disabled={isPending}>
                    Aplicar
                  </Button>
                </div>
              )}

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-ash">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-ash">
                  <span>Taxa de entrega</span>
                  <span>{deliveryFee === 0 ? "Grátis" : formatMoney(deliveryFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Desconto</span>
                    <span>-{formatMoney(discount)}</span>
                  </div>
                )}
                {deliveryFee > 0 && (
                  <p className="text-xs text-ash-light">
                    Faltam {formatMoney(FREE_DELIVERY_THRESHOLD - subtotal)} para frete grátis
                  </p>
                )}
                <div className="flex justify-between font-display text-lg text-ink pt-2 border-t border-ink/5">
                  <span>Total</span>
                  <span className="text-flame">{formatMoney(total)}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Finalizar Pedido
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
