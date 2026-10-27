import { expect, it } from "vitest";
import { checkoutSchema } from "./validations";
import { CARD_BRANDS, paymentDescription } from "./payment-options";
const base = { name: "Cliente", phone: "11999990001", deliveryType: "RETIRADA" };
it.each(["CREDITO", "DEBITO"])("requires an accepted card brand for %s", paymentMethod => {
  expect(checkoutSchema.safeParse({ ...base, paymentMethod }).success).toBe(false);
  for (const paymentCardBrand of CARD_BRANDS) expect(checkoutSchema.safeParse({ ...base, paymentMethod, paymentCardBrand }).success).toBe(true);
  expect(checkoutSchema.safeParse({ ...base, paymentMethod, paymentCardBrand: "Fabricada" }).success).toBe(false);
});
it.each(["PIX", "PIX_ENTREGA", "DINHEIRO"])("does not accept card metadata for %s", paymentMethod => {
  expect(checkoutSchema.safeParse({ ...base, paymentMethod }).success).toBe(true);
  expect(checkoutSchema.safeParse({ ...base, paymentMethod, paymentCardBrand: "Visa" }).success).toBe(false);
});
it("separates online Pix from payment at receipt and keeps legacy orders readable", () => {
  expect(paymentDescription({ paymentMethod: "PIX" })).toBe("Pix no site");
  expect(paymentDescription({ paymentMethod: "PIX_ENTREGA" })).toBe("Pix na entrega");
  expect(paymentDescription({ paymentMethod: "CREDITO", paymentCardBrand: "Elo", deliveryType: "RETIRADA" })).toBe("Crédito na retirada · Elo");
  expect(paymentDescription({ paymentMethod: "CARTAO" })).toBe("Cartão na entrega");
  expect(checkoutSchema.safeParse({ ...base, paymentMethod: "CARTAO" }).success).toBe(false);
  expect(checkoutSchema.safeParse({ ...base, paymentMethod: "PIX_ENTREGA", changeFor: 100 }).success).toBe(false);
});
