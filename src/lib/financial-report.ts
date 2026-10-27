export type FinancialOrder = { status: string; paymentStatus: string; paymentMethod: string; total: number; subtotal: number; deliveryFee: number; discount: number; deliveryPayout: number; paymentFee: number | null };
const cents = (value: number) => Math.round(value * 100);
export function summarizeFinancialOrders(orders: FinancialOrder[]) {
  const result = { received: 0, pending: 0, cancelled: 0, refunded: 0, failed: 0, grossProducts: 0, deliveryFees: 0, discounts: 0, driverPayouts: 0, paymentFees: 0, missingPaymentFees: 0, paidOrders: 0, totalOrders: orders.length, cancelledOrders: 0, netAfterKnownCosts: 0, avgTicket: 0 };
  for (const order of orders) {
    const cancelled = ["CANCELADO", "RECUSADO"].includes(order.status);
    if (cancelled) { result.cancelled += cents(order.total); result.cancelledOrders++; }
    else { result.grossProducts += cents(order.subtotal); result.deliveryFees += cents(order.deliveryFee); result.discounts += cents(order.discount); }
    if (order.paymentStatus === "ESTORNADO") result.refunded += cents(order.total);
    if (!cancelled && order.paymentStatus === "PAGO") { result.received += cents(order.total); result.paidOrders++; }
    if (!cancelled && order.paymentStatus === "PENDENTE") result.pending += cents(order.total);
    if (!cancelled && order.paymentStatus === "FALHOU") result.failed += cents(order.total);
    if (order.status === "ENTREGUE") result.driverPayouts += cents(order.deliveryPayout);
    if (order.paymentFee !== null) result.paymentFees += cents(order.paymentFee);
    else if (order.paymentStatus === "PAGO" && ["PIX", "CREDITO", "DEBITO", "CARTAO"].includes(order.paymentMethod)) result.missingPaymentFees++;
  }
  result.netAfterKnownCosts = result.received - result.driverPayouts - result.paymentFees;
  result.avgTicket = result.paidOrders ? Math.round(result.received / result.paidOrders) : 0;
  for (const key of ["received", "pending", "cancelled", "refunded", "failed", "grossProducts", "deliveryFees", "discounts", "driverPayouts", "paymentFees", "netAfterKnownCosts", "avgTicket"] as const) result[key] /= 100;
  return result;
}
export function csvCell(value: unknown) {
  if (typeof value === "number") return `"${Number.isFinite(value) ? String(value).replace(".", ",") : ""}"`;
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function financialPeriod(from?: string, to?: string, now = new Date()): { from: string; to: string; start: Date; end: Date; invalid: boolean } {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const start = from || today.slice(0, 8) + "01", end = to || today;
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
  if (!valid(start) || !valid(end) || start > end || Date.parse(end) - Date.parse(start) > 365 * 86400000) return { ...financialPeriod(undefined, undefined, now), invalid: true };
  return { from: start, to: end, start: new Date(start + "T00:00:00-03:00"), end: new Date(Date.parse(end + "T00:00:00-03:00") + 86400000), invalid: false };
}
