import { expect, it } from "vitest";
import { cartSelectionSchema, priceCart, cartTotal } from "./checkout-security";
const product = { id: "p", restaurantId: "store", name: "Burger", image: "/burger.png", ingredients: "Salada, Cebola", available: true, price: 18.9, promoPrice: null, addons: [{ addon: { id: "a", restaurantId: "store", name: "Queijo", price: 2.1, type: "EXTRA" } }] };
const selection = { productId: "p", quantity: 2, addons: [{ id: "a" }], removedIngredients: [], notes: "" };
it("ignores tampered client prices, names and addon prices", () => {
  const input = cartSelectionSchema.parse([{ ...selection, unitPrice: 0, name: "Fake", addons: [{ id: "a", price: -100 }] }]);
  const items = priceCart(input, [product], "store");
  expect(items[0].name).toBe("Burger");
  expect(cartTotal(items)).toBe(42);
});
it.each([0, -1, 1.5, 21, Number.NaN, Infinity])("rejects invalid quantity %s", quantity => {
  expect(cartSelectionSchema.safeParse([{ ...selection, quantity }]).success).toBe(false);
});
it("rejects unavailable and foreign products and addons", () => {
  expect(() => priceCart([selection], [{ ...product, available: false }], "store")).toThrow();
  expect(() => priceCart([selection], [product], "foreign")).toThrow();
  expect(() => priceCart([selection], [{ ...product, addons: [{ addon: { ...product.addons[0].addon, restaurantId: "foreign" } }] }], "store")).toThrow();
  expect(() => priceCart([{ ...selection, addons: [{ id: "unknown" }] }], [product], "store")).toThrow();
});
it("rejects duplicate addons and fabricated ingredient removals", () => {
  expect(() => priceCart([{ ...selection, addons: [{ id: "a" }, { id: "a" }] }], [product], "store")).toThrow();
  expect(() => priceCart([{ ...selection, removedIngredients: ["Unknown"] }], [product], "store")).toThrow();
});
it("uses promotional prices and integer cents", () => {
  const items = priceCart([selection], [{ ...product, promoPrice: 10.2 }], "store");
  expect(cartTotal(items)).toBe(24.6);
});
