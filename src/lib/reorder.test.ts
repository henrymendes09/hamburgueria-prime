import { expect, it } from "vitest";
import { rebuildOrder } from "./reorder";
const product = {
  id: "p",
  restaurantId: "store",
  name: "Burger atual",
  image: "/burger.png",
  ingredients: "Carne, Cebola",
  available: true,
  price: 30,
  promoPrice: 25,
  addons: [
    {
      addon: {
        id: "a",
        restaurantId: "store",
        name: "Queijo",
        price: 3,
        type: "EXTRA",
      },
    },
  ],
};
const line = {
  productId: "p",
  productName: "Burger antigo",
  quantity: 2,
  unitPrice: 20,
  addonsLabel: "Queijo",
  removedLabel: "Cebola",
  notes: "Bem passado",
};
it("rebuilds quantities and customizations with current promotion and addon prices", () => {
  const result = rebuildOrder([line], [product], "store");
  expect(result.items[0]).toMatchObject({
    name: "Burger atual",
    quantity: 2,
    unitPrice: 25,
    addons: [{ id: "a", price: 3 }],
    removedIngredients: ["Cebola"],
    notes: "Bem passado",
  });
  expect(result.warnings).toHaveLength(1);
});
it("does not use unavailable, deleted or foreign products", () => {
  for (const products of [
    [],
    [{ ...product, available: false }],
    [{ ...product, restaurantId: "other" }],
  ])
    expect(rebuildOrder([line], products, "store").items).toEqual([]);
});
it("skips changed and ambiguous customizations instead of silently changing the meal", () => {
  for (const p of [
    { ...product, ingredients: "Carne" },
    { ...product, addons: [] },
    {
      ...product,
      addons: [
        ...product.addons,
        { addon: { ...product.addons[0].addon, id: "duplicate" } },
      ],
    },
  ]) {
    const result = rebuildOrder([line], [p], "store");
    expect(result.items).toEqual([]);
    expect(result.warnings[0]).toContain("Personalize");
  }
});
it("keeps available lines while explaining omitted products", () => {
  const result = rebuildOrder(
    [line, { ...line, productId: "deleted" }],
    [product],
    "store",
  );
  expect(result.items).toHaveLength(1);
  expect(result.warnings.some((w) => w.includes("indisponível"))).toBe(true);
});
it("rejects invalid quantities and oversized previous orders", () => {
  expect(
    rebuildOrder([{ ...line, quantity: 21 }], [product], "store").items,
  ).toEqual([]);
  expect(
    rebuildOrder(
      Array.from({ length: 6 }, () => ({ ...line, quantity: 20 })),
      [product],
      "store",
    ).items,
  ).toEqual([]);
});
