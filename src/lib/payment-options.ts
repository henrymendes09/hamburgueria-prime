export const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard", "Diners Club", "Outra"] as const;
export const DELIVERY_PAYMENTS = [
  { value: "PIX_ENTREGA", label: "Pix" },
  { value: "CREDITO", label: "Crédito" },
  { value: "DEBITO", label: "Débito" },
  { value: "DINHEIRO", label: "Dinheiro" },
] as const;
export type DeliveryPaymentMethod = typeof DELIVERY_PAYMENTS[number]["value"];
export function isCardPayment(method: string) { return method === "CREDITO" || method === "DEBITO"; }
export function paymentDescription(order: { paymentMethod: string; paymentCardBrand?: string | null; deliveryType?: string }) {
  const when = order.deliveryType === "RETIRADA" ? "na retirada" : "na entrega";
  const labels: Record<string, string> = { PIX: "Pix no site", PIX_ENTREGA: `Pix ${when}`, CREDITO: `Crédito ${when}`, DEBITO: `Débito ${when}`, CARTAO: `Cartão ${when}`, DINHEIRO: `Dinheiro ${when}` };
  return `${labels[order.paymentMethod] ?? order.paymentMethod}${order.paymentCardBrand ? ` · ${order.paymentCardBrand}` : ""}`;
}
