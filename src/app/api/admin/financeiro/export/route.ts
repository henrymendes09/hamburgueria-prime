import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { financialPeriod, csvCell, summarizeFinancialOrders } from "@/lib/financial-report";
import { paymentDescription } from "@/lib/payment-options";
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || session.user.role !== "ADMIN" || !session.user.restaurantId) return new Response("Não autorizado", { status: 401 });
  const params = new URL(request.url).searchParams, period = financialPeriod(params.get("de") ?? undefined, params.get("ate") ?? undefined);
  if (period.invalid) return new Response("Período inválido", { status: 400 });
  const orders = await prisma.order.findMany({ where: { restaurantId: session.user.restaurantId, createdAt: { gte: period.start, lt: period.end } }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  const totals = summarizeFinancialOrders(orders);
  const rows: unknown[][] = [["Relatório financeiro", period.from, period.to], ["Recebido", totals.received], ["Pendente", totals.pending], ["Cancelados/recusados (valor dos pedidos)", totals.cancelled], ["Estornado", totals.refunded], ["Frete cobrado", totals.deliveryFees], ["Descontos", totals.discounts], ["Repasses de entregas concluídas", totals.driverPayouts], ["Taxas de pagamento informadas", totals.paymentFees], ["Recebido menos taxas informadas e repasses (não é lucro)", totals.netAfterKnownCosts], [], ["Pedido", "Cliente", "Status", "Situação pagamento", "Forma", "Subtotal", "Frete", "Desconto", "Total", "Taxa pagamento", "Repasse entregador", "Criado em (Brasília)"]];
  for (const order of orders) rows.push([order.number, order.user.name, order.status, order.paymentStatus, paymentDescription(order), order.subtotal, order.deliveryFee, order.discount, order.total, order.paymentFee ?? "Não informada", order.deliveryPayout, order.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })]);
  return new Response("\uFEFF" + rows.map(row => row.map(csvCell).join(";")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="financeiro-${period.from}-${period.to}.csv"`, "Cache-Control": "private, no-store" } });
}
