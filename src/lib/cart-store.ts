"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types/cart";

type CouponState = {
  code: string;
  type: "PERCENTUAL" | "VALOR";
  value: number;
} | null;

type CartState = {
  items: CartItem[];
  coupon: CouponState;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "cartItemId">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  applyCoupon: (coupon: CouponState) => void;
  removeCoupon: () => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

function itemPrice(item: CartItem): number {
  const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
  return (item.unitPrice + addonsTotal) * item.quantity;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isOpen: false,
      addItem: (item) => {
        const cartItemId = `${item.productId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        set({ items: [...get().items, { ...item, cartItemId }], isOpen: true });
      },
      removeItem: (cartItemId) => {
        set({ items: get().items.filter((i) => i.cartItemId !== cartItemId) });
      },
      updateQuantity: (cartItemId, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity } : i
          ),
        });
      },
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
      clear: () => set({ items: [], coupon: null }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
    }),
    { name: "hamburgueria-prime-cart" }
  )
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + itemPrice(item), 0);
}

export { itemPrice };
