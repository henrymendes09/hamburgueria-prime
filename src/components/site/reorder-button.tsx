"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { prepareReorderAction } from "@/actions/reorder";
import { useCartStore, itemPrice, cartSubtotal } from "@/lib/cart-store";
import type { CartItem } from "@/types/cart";
import { formatMoney } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ReorderButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{
    items: CartItem[];
    warnings: string[];
  } | null>(null);
  const hasCart = useCartStore((state) => state.items.length > 0);
  async function prepare() {
    setBusy(true);
    try {
      const result = await prepareReorderAction(orderId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setReview({ items: result.items, warnings: result.warnings });
    } catch {
      toast.error("Não foi possível consultar o cardápio. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  function confirm() {
    if (!review?.items.length) return;
    useCartStore.getState().replaceItems(review.items);
    setReview(null);
    toast.success("Carrinho montado. Confira os itens antes de finalizar.");
  }
  return (
    <>
      <button
        type="button"
        onClick={prepare}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold hover:border-flame disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        {busy ? "Conferindo cardápio…" : "Pedir novamente"}
      </button>
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] p-6">
          <DialogTitle className="pr-8">Pedir novamente</DialogTitle>
          <DialogDescription>
            Produtos e adicionais com os preços atuais. Entrega e descontos
            serão calculados na finalização.
          </DialogDescription>
          {review?.warnings.length ? (
            <ul className="space-y-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {review.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          ) : null}
          <ul className="divide-y divide-ink/10">
            {review?.items.map((item) => (
              <li key={item.cartItemId} className="py-3 text-sm">
                <div className="flex justify-between gap-3 font-semibold">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="whitespace-nowrap">
                    {formatMoney(itemPrice(item))}
                  </span>
                </div>
                {item.addons.length > 0 && (
                  <p className="mt-1 text-ash">
                    Adicionais: {item.addons.map((a) => a.name).join(", ")}
                  </p>
                )}
                {item.removedIngredients.length > 0 && (
                  <p className="text-ash">
                    Sem: {item.removedIngredients.join(", ")}
                  </p>
                )}
                {item.notes && (
                  <p className="text-ash">Observação: {item.notes}</p>
                )}
              </li>
            ))}
          </ul>
          {!!review?.items.length && (
            <>
              <p className="flex justify-between font-bold">
                <span>Produtos</span>
                {formatMoney(cartSubtotal(review.items))}
              </p>
              {hasCart && (
                <p className="text-sm text-ash">
                  Ao confirmar, os itens atuais do carrinho serão substituídos.
                </p>
              )}
              <button
                onClick={confirm}
                className="min-h-11 rounded-full bg-flame px-4 py-3 font-bold text-white"
              >
                {hasCart ? "Substituir meu carrinho" : "Montar carrinho"}
              </button>
            </>
          )}
          {!review?.items.length && (
            <p className="text-sm text-ash">
              Nenhum item deste pedido pode ser adicionado agora. Seu carrinho
              foi mantido.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
