import { z } from "zod";
import type { CartItem } from "@/types/cart";

export const cartSelectionSchema = z.array(z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(20),
  addons: z.array(z.object({ id: z.string().min(1).max(64) })).max(20).default([]),
  removedIngredients: z.array(z.string().max(128)).max(30).default([]),
  notes: z.string().max(1000).default(""),
})).min(1).max(50).refine(items => items.reduce((sum, item) => sum + item.quantity, 0) <= 100);

type CatalogProduct = {
  id: string; restaurantId: string; name: string; image: string; ingredients: string;
  available: boolean; price: number; promoPrice: number | null;
  addons: { addon: { id: string; restaurantId: string; name: string; price: number; type: string } }[];
};

export function priceCart(selections: z.infer<typeof cartSelectionSchema>, products: CatalogProduct[], restaurantId: string): CartItem[] {
  const catalog = new Map(products.map(product => [product.id, product]));
  return selections.map((selection, index) => {
    const product = catalog.get(selection.productId);
    if (!product || !product.available || product.restaurantId !== restaurantId) throw new Error("Produto indisponível nesta loja.");
    const unitPrice = product.promoPrice ?? product.price;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error("Preço de produto inválido.");
    const allowed = new Map(product.addons.map(({ addon }) => [addon.id, addon]));
    const ids = selection.addons.map(addon => addon.id);
    if (new Set(ids).size !== ids.length) throw new Error("Adicionais duplicados.");
    let cookingOptions = 0;
    const addons = ids.map(id => {
      const addon = allowed.get(id);
      if (!addon || addon.restaurantId !== restaurantId || addon.type === "REMOVER" || !Number.isFinite(addon.price) || addon.price < 0) throw new Error("Adicional inválido para este produto.");
      if (addon.type === "PONTO" && ++cookingOptions > 1) throw new Error("Escolha apenas um ponto da carne.");
      return { id: addon.id, name: addon.name, price: addon.price };
    });
    const removables = new Set([...product.ingredients.split(",").map(value => value.trim()), ...product.addons.filter(({ addon }) => addon.restaurantId === restaurantId && addon.type === "REMOVER").map(({ addon }) => addon.name)]);
    if (selection.removedIngredients.some(value => !removables.has(value))) throw new Error("Ingrediente inválido para este produto.");
    return { cartItemId: `server-${index}`, productId: product.id, name: product.name, image: product.image, unitPrice, quantity: selection.quantity, addons, removedIngredients: [...new Set(selection.removedIngredients)], notes: selection.notes };
  });
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (Math.round(item.unitPrice * 100) + item.addons.reduce((total, addon) => total + Math.round(addon.price * 100), 0)) * item.quantity, 0) / 100;
}
