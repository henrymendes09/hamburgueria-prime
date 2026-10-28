import { expect, it } from "vitest";
import { waitingMinutes, newKitchenOrders, preparationIngredients, type KitchenOrder } from "./kitchen";
it("lists preparation ingredients without removed items or blank/duplicate entries", () => {
  expect(preparationIngredients("Pão, Carne, Cebola, Queijo, , Carne", "cebola")).toEqual(["Pão", "Carne", "Queijo"]);
  expect(preparationIngredients("", null)).toEqual([]);
  expect(preparationIngredients("Carne, Cebola", "Carne, Cebola")).toEqual([]);
});
it("counts elapsed waiting time across midnight without negative times", () => {
  expect(
    waitingMinutes("2026-10-28T23:55:00Z", Date.parse("2026-10-29T00:15:59Z")),
  ).toBe(20);
  expect(
    waitingMinutes("2026-10-29T00:15:00Z", Date.parse("2026-10-28T23:55:00Z")),
  ).toBe(0);
});
it("alerts only for unseen orders, not status changes or repeated polls", () => {
  const orders = [
    { id: "old", status: "PREPARANDO" },
    { id: "new", status: "RECEBIDO" },
  ] as KitchenOrder[];
  expect(
    newKitchenOrders(new Set(["old"]), orders).map((order) => order.id),
  ).toEqual(["new"]);
  expect(newKitchenOrders(new Set(["old", "new"]), orders)).toEqual([]);
});
