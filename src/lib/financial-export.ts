import { prisma } from "./prisma";
import { financialPeriod, revenueSeries, summarizeFinancialOrders, type FinancialOrder } from "./financial-report";
import { ORDER_STATUS_LABEL } from "./utils";

export type ExportOrder = FinancialOrder & { number: number; customer: string; createdAt: Date; paymentCardBrand: string | null; deliveryType: string; items: { name: string; quantity: number; unitPrice: number }[] };
export type FinancialExport = ReturnType<typeof buildFinancialExport>;
export const PAYMENT_STATUS_LABEL: Record<string, string> = { PAGO: "Pago", PENDENTE: "Pendente", ESTORNADO: "Estornado", FALHOU: "Falhou" };
export const orderStatusLabel = (value: string) => ORDER_STATUS_LABEL[value] ?? "A confirmar";
export const dateBR = (date: string) => date.split("-").reverse().join("/");
export const dateTimeBR = (date: Date) => date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function buildFinancialExport(name: string, period: ReturnType<typeof financialPeriod>, orders: ExportOrder[], generatedAt = new Date()) {
  const products = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of orders) {
    if (order.paymentStatus !== "PAGO" || ["CANCELADO", "RECUSADO"].includes(order.status)) continue;
    for (const item of order.items) {
      const product = products.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 };
      product.quantity += item.quantity;
      product.revenue = Math.round((product.revenue + item.quantity * item.unitPrice) * 100) / 100;
      products.set(item.name, product);
    }
  }
  return { name, period, orders, generatedAt, summary: summarizeFinancialOrders(orders), revenue: revenueSeries(orders, period.from, period.to), products: [...products.values()].sort((a, b) => b.quantity - a.quantity) };
}
export async function loadFinancialExport(restaurantId: string, period: ReturnType<typeof financialPeriod>) {
  const [restaurant, orders] = await Promise.all([
    prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { name: true } }),
    prisma.order.findMany({ where: { restaurantId, createdAt: { gte: period.start, lt: period.end } }, include: { user: { select: { name: true } }, items: { select: { productName: true, quantity: true, unitPrice: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
  ]);
  return buildFinancialExport(restaurant.name, period, orders.map(order => ({ ...order, customer: order.user.name, items: order.items.map(item => ({ name: item.productName, quantity: item.quantity, unitPrice: item.unitPrice })) })));
}
export function composition(report: FinancialExport): [string, number][] {
  const s = report.summary;
  return [["Produtos (pedidos válidos)", s.grossProducts], ["Fretes cobrados", s.deliveryFees], ["Descontos concedidos", s.discounts], ["Cancelados ou recusados", s.cancelled], ["Estornos confirmados", s.refunded], ["Pagamentos com falha", s.failed], ["Repasses de entregas concluídas", s.driverPayouts], ["Taxas de pagamento informadas", s.paymentFees], ["Recebido menos taxas e repasses", s.netAfterKnownCosts]];
}
export function reportNotes(report: FinancialExport) {
  return ["Período pela data do pedido, no fuso de Brasília. Situação de pagamento na emissão do relatório.", "Recebido: pedidos pagos e não cancelados. Produtos, fretes e descontos: pedidos não cancelados, inclusive pendentes.", "O saldo não é lucro: custos dos produtos, impostos e despesas da loja não estão incluídos.", `${report.summary.missingPaymentFees} pagamentos recebidos por Pix online/cartão estão sem taxa informada. Taxas não são estimadas.`];
}
export async function receiptChart(report: FinancialExport) {
  const { default: sharp } = await import("sharp");
  const data = report.revenue, max = Math.max(1, ...data.map(day => day.total));
  const x = (i: number) => 82 + i * 1070 / Math.max(1, data.length - 1), y = (value: number) => 245 - value / max * 185;
  const points = data.map((day, i) => `${x(i)},${y(day.total)}`).join(" ");
  const ticks = Array.from({ length: 4 }, (_, i) => { const value = max * i / 3; return `<line x1="82" x2="1152" y1="${y(value)}" y2="${y(value)}" stroke="#e5e7eb"/><text x="70" y="${y(value) + 5}" text-anchor="end">${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</text>`; }).join("");
  const labels = data.flatMap((day, i) => i === 0 || i === data.length - 1 || i % Math.max(1, Math.ceil(data.length / 6)) === 0 ? [`<text x="${x(i)}" y="275" text-anchor="middle">${day.date}</text>`] : []).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300"><rect width="1200" height="300" fill="white"/><g font-family="Arial,sans-serif" font-size="26" fill="#666"><text x="82" y="28" font-size="28" fill="#171717">Recebimentos por dia (R$)</text>${ticks}${labels}<polyline points="${points}" fill="none" stroke="#e01b22" stroke-width="4"/>${data.length === 1 ? `<circle cx="82" cy="${y(data[0].total)}" r="5" fill="#e01b22"/>` : ""}</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
