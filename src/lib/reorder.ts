import { cartSelectionSchema, priceCart } from "@/lib/checkout-security";
import type { CartItem } from "@/types/cart";

type PreviousItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  addonsLabel: string | null;
  removedLabel: string | null;
  notes: string | null;
};
type Product = Parameters<typeof priceCart>[1][number];

// Old orders contain labels, not option IDs. Ambiguous or missing options must
// never silently become a different meal (especially ingredient removals).
export function rebuildOrder(
  previous: PreviousItem[],
  products: Product[],
  restaurantId: string,
) {
  const items: CartItem[] = [],
    warnings: string[] = [];
  for (const line of previous) {
    const product = products.find(
      (p) =>
        p.id === line.productId &&
        p.restaurantId === restaurantId &&
        p.available,
    );
    if (!product) {
      warnings.push(`${line.productName}: indisponível no momento.`);
      continue;
    }
    try {
      const labels = line.addonsLabel ? line.addonsLabel.split(", ") : [];
      const addons = labels.map((name) => {
        const matches = product.addons.filter(
          ({ addon }) =>
            addon.name === name &&
            addon.type !== "REMOVER" &&
            addon.restaurantId === restaurantId,
        );
        if (matches.length !== 1) throw Error("changed-options");
        return { id: matches[0].addon.id };
      });
      const selection = cartSelectionSchema.parse([
        {
          productId: product.id,
          quantity: line.quantity,
          addons,
          removedIngredients: line.removedLabel?.split(", ") ?? [],
          notes: line.notes ?? "",
        },
      ]);
      const [item] = priceCart(selection, [product], restaurantId);
      items.push({ ...item, cartItemId: `reorder-${items.length}` });
      const current =
        item.unitPrice +
        item.addons.reduce((sum, addon) => sum + addon.price, 0);
      if (Math.round(current * 100) !== Math.round(line.unitPrice * 100))
        warnings.push(
          `${product.name}: preço atualizado para o valor atual do cardápio.`,
        );
    } catch {
      warnings.push(
        `${line.productName}: as opções mudaram. Personalize este produto novamente no cardápio.`,
      );
    }
  }
  if (
    items.length > 50 ||
    items.reduce((sum, item) => sum + item.quantity, 0) > 100
  )
    return {
      items: [],
      warnings: [
        "Este pedido excede o limite do carrinho. Escolha os produtos no cardápio.",
      ],
    };
  return { items, warnings };
}
