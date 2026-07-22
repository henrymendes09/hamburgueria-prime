"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";
import { ProductCardData } from "@/types/product";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";

export function ProductModal({
  product,
  open,
  onOpenChange,
}: {
  product: ProductCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  const basePrice = product.promoPrice ?? product.price;
  const extras = product.addons.filter((a) => a.type === "EXTRA");
  const removables = product.addons.filter((a) => a.type === "REMOVER");
  const pontos = product.addons.filter((a) => a.type === "PONTO");

  const ingredientList = useMemo(
    () => product.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
    [product.ingredients]
  );

  const addonsTotal = product.addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (basePrice + addonsTotal) * quantity;

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function toggleIngredient(name: string) {
    setRemovedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  }

  function selectPonto(id: string) {
    // Ponto da carne é seleção única entre as opções do tipo PONTO
    setSelectedAddons((prev) => [...prev.filter((sid) => !pontos.some((p) => p.id === sid)), id]);
  }

  function handleAddToCart() {
    const chosenAddons = product.addons
      .filter((a) => selectedAddons.includes(a.id))
      .map((a) => ({ id: a.id, name: a.name, price: a.price }));

    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice: basePrice,
      quantity,
      addons: chosenAddons,
      removedIngredients,
      notes,
    });

    toast.success(`${product.name} adicionado ao carrinho!`);
    onOpenChange(false);
    setQuantity(1);
    setSelectedAddons([]);
    setRemovedIngredients([]);
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] max-w-4xl flex-col gap-0 overflow-hidden sm:w-[calc(100%-2rem)] lg:grid lg:h-[88dvh] lg:max-h-[720px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative aspect-[16/8] w-full shrink-0 overflow-hidden bg-ink lg:aspect-auto lg:h-full">
          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="512px" />
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <DialogHeader className="pr-14">
            <DialogTitle>{product.name}</DialogTitle>
            <p className="text-sm text-ash mt-1 normal-case">{product.description}</p>
            <p className="text-xs text-ash-light mt-1 normal-case">Ingredientes: {product.ingredients}</p>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5">
          {pontos.length > 0 && (
            <div>
              <Label>Ponto da carne</Label>
              <div className="flex flex-wrap gap-2">
                {pontos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPonto(p.id)}
                    className={`rounded-full border-2 px-4 py-2 text-xs font-bold uppercase transition-colors ${
                      selectedAddons.includes(p.id)
                        ? "border-flame bg-flame text-white"
                        : "border-ink/10 text-ink/70"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ingredientList.length > 0 && (
            <div>
              <Label>Remover ingredientes</Label>
              <div className="grid grid-cols-2 gap-2">
                {ingredientList.map((ing) => (
                  <label key={ing} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <Checkbox
                      checked={removedIngredients.includes(ing)}
                      onCheckedChange={() => toggleIngredient(ing)}
                    />
                    Sem {ing}
                  </label>
                ))}
                {removables.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <Checkbox
                      checked={removedIngredients.includes(r.name)}
                      onCheckedChange={() => toggleIngredient(r.name)}
                    />
                    Sem {r.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {extras.length > 0 && (
            <div>
              <Label>Adicionais</Label>
              <div className="space-y-2">
                {extras.map((extra) => (
                  <label
                    key={extra.id}
                    className="flex items-center justify-between rounded-xl border-2 border-ink/5 px-3 py-2.5 cursor-pointer hover:border-flame/30"
                  >
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <Checkbox
                        checked={selectedAddons.includes(extra.id)}
                        onCheckedChange={() => toggleAddon(extra.id)}
                      />
                      Adicionar {extra.name}
                    </span>
                    <span className="text-sm font-bold text-flame">+{formatMoney(extra.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Ex: caprichar no molho, cortar ao meio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t border-ink/5 bg-paper/95 px-6 pb-1 pt-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full border-2 border-ink/10 px-2 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5"
                aria-label="Diminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-5 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button onClick={handleAddToCart} size="lg" className="min-w-0 flex-1 sm:flex-none">
              Adicionar · {formatMoney(totalPrice)}
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
