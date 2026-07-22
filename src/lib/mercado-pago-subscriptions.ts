type SubscriptionCheckout = { id: string; init_point: string; status: string };

export function mercadoPagoIsConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("APP_USR-") && process.env.MERCADOPAGO_ACCESS_TOKEN.length > 40);
}

export async function createMercadoPagoSubscription(input: {
  subscriptionId: string;
  restaurantName: string;
  payerEmail: string;
  amount: number;
  cycle: "MONTHLY" | "YEARLY";
}) {
  if (!mercadoPagoIsConfigured()) return null;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: `Assinatura ${input.restaurantName}`,
      external_reference: input.subscriptionId,
      payer_email: input.payerEmail,
      auto_recurring: {
        frequency: input.cycle === "YEARLY" ? 12 : 1,
        frequency_type: "months",
        transaction_amount: input.amount,
        currency_id: "BRL",
      },
      back_url: `${baseUrl}/admin?assinatura=retorno`,
      status: "pending",
    }),
  });
  if (!response.ok) throw new Error(`Mercado Pago: ${response.status}`);
  return (await response.json()) as SubscriptionCheckout;
}
