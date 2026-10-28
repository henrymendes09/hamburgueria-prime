import { auth } from "@/lib/auth";
import { financialPeriod, csvCell } from "@/lib/financial-report";
import { composition, dateTimeBR, loadFinancialExport, orderStatusLabel, PAYMENT_STATUS_LABEL } from "@/lib/financial-export";
import { paymentDescription } from "@/lib/payment-options";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || session.user.role !== "ADMIN" || !session.user.restaurantId) return new Response("Não autorizado", { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const params = new URL(request.url).searchParams, period = financialPeriod(params.get("de") ?? undefined, params.get("ate") ?? undefined);
  if (period.invalid) return new Response("Período inválido", { status: 400 });
  const format = params.get("formato") ?? "xlsx";
  if (!["xlsx", "pdf", "csv"].includes(format)) return new Response("Formato inválido", { status: 400 });
  const report = await loadFinancialExport(session.user.restaurantId, period);
  const headers = { "Content-Disposition": `attachment; filename="financeiro-${period.from}-${period.to}.${format}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (format === "pdf") {
    const { financialPdf } = await import("@/lib/financial-pdf");
    return new Response(await financialPdf(report), { headers: { ...headers, "Content-Type": "application/pdf" } });
  }
  if (format === "xlsx") {
    const { financialWorkbook } = await import("@/lib/financial-workbook");
    return new Response(await financialWorkbook(report), { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } });
  }
  const rows: unknown[][] = [["Relatório financeiro", period.from, period.to], ["Recebido", report.summary.received], ["Pendente", report.summary.pending], ...composition(report), [], ["Pedido", "Cliente", "Situação", "Pagamento", "Forma", "Produtos", "Frete", "Desconto", "Total", "Taxa", "Repasse", "Criado em (Brasília)"]];
  for (const order of report.orders) rows.push([order.number, order.customer, orderStatusLabel(order.status), PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "A confirmar", paymentDescription(order), order.subtotal, order.deliveryFee, order.discount, order.total, order.paymentFee ?? "Não informada", order.deliveryPayout, dateTimeBR(order.createdAt)]);
  return new Response("\uFEFF" + rows.map(row => row.map(csvCell).join(";")).join("\r\n"), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
}
