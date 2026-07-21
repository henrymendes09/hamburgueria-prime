export type CartAddonSelection = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  cartItemId: string; // id único da linha no carrinho (mesmo produto pode aparecer 2x com customizações diferentes)
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  addons: CartAddonSelection[];
  removedIngredients: string[];
  notes: string;
};
