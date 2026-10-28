"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, Clock3, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { paymentDescription } from "@/lib/payment-options";
import { formatMoney, ORDER_STATUS_LABEL } from "@/lib/utils";
import type { summarizeFinancialOrders } from "@/lib/financial-report";
import { saveOrderFeeAction } from "@/actions/financial";
import { Button } from "@/components/ui/button";
import { RevenueChart } from "./revenue-chart";
import { TopProductsChart } from "./top-products-chart";

type OrderRow = { id: string; number: number; customer: string; status: string; paymentStatus: string; total: number; subtotal: number; deliveryFee: number; discount: number; deliveryPayout: number; paymentFee: number | null; paymentMethod: string; paymentCardBrand?: string | null; deliveryType?: string; createdAt: string };
type Props = { summary: ReturnType<typeof summarizeFinancialOrders>; revenue: { date: string; total: number }[]; topProducts: { name: string; qty: number; revenue: number }[]; orders: OrderRow[]; period: { from: string; to: string } };
const paymentLabels: Record<string, string> = { PAGO: "Pago", PENDENTE: "Pendente", ESTORNADO: "Estornado", FALHOU: "Falhou" };

export function FinanceiroManager({ summary, revenue, topProducts, orders, period }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  async function fee(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("fee") ?? "");
    setSaving(id);
    try {
      const result = await saveOrderFeeAction(id, raw === "" ? null : Number(raw));
      if (result.success) { toast.success(result.message); router.refresh(); } else toast.error(result.message);
    } catch { toast.error("Não foi possível salvar a taxa."); } finally { setSaving(null); }
  }
  const cards = [
    { label: "Recebido", value: formatMoney(summary.received), hint: `${summary.paidOrders} pedidos pagos`, Icon: Wallet, primary: true },
    { label: "A receber", value: formatMoney(summary.pending), hint: "Pagamentos pendentes", Icon: Clock3 },
    { label: "Pedidos", value: String(summary.totalOrders), hint: `${summary.cancelledOrders} cancelados ou recusados`, Icon: ReceiptText },
    { label: "Ticket médio", value: formatMoney(summary.avgTicket), hint: "Por pedido pago", Icon: TrendingUp },
  ];
  const breakdown = [
    ["Produtos vendidos (valor bruto)", summary.grossProducts], ["Fretes cobrados", summary.deliveryFees], ["Descontos concedidos", summary.discounts], ["Pedidos cancelados ou recusados", summary.cancelled], ["Estornos confirmados", summary.refunded], ["Pagamentos com falha", summary.failed], ["Repasses das entregas concluídas", summary.driverPayouts], ["Taxas de pagamento informadas", summary.paymentFees], ["Recebido menos taxas e repasses", summary.netAfterKnownCosts],
  ] as const;
  return <div className="space-y-6 normal-case">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, hint, Icon, primary }) => <section key={label} className={`rounded-2xl border p-5 sm:p-6 ${primary ? "border-ink bg-ink text-white" : "border-ink/5 bg-white"}`}><div className="flex items-center justify-between gap-2"><h2 style={{ fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: "normal" }} className={`text-base leading-6 font-semibold ${primary ? "text-white" : "text-ink"}`}>{label}</h2><Icon aria-hidden="true" className={`h-5 w-5 ${primary ? "text-red-400" : "text-flame"}`} /></div><p className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p><p className={`mt-2 text-xs ${primary ? "text-white/60" : "text-ash"}`}>{hint}</p></section>)}</div>
    <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
      <section aria-label="Gráfico de recebimentos" className="min-w-0 rounded-2xl border border-ink/5 bg-white p-4 sm:p-6"><h2 className="font-display text-2xl">Recebimentos no período</h2><p className="mb-6 mt-1 text-xs text-ash">Pedidos pagos e válidos, pela data do pedido.</p><RevenueChart data={revenue} />{summary.paidOrders === 0 && <p className="mt-3 text-center text-sm text-ash">Ainda não há pagamentos recebidos neste período.</p>}</section>
      <section aria-label="Gráfico de produtos mais vendidos" className="min-w-0 rounded-2xl border border-ink/5 bg-white p-4 sm:p-6"><h2 className="font-display text-2xl">Mais vendidos</h2><p className="mb-6 mt-1 text-xs text-ash">Os 5 favoritos em pedidos pagos · quantidade vendida.</p>{topProducts.length ? <TopProductsChart data={topProducts.map(product => ({ name: product.name, soldCount: product.qty }))} /> : <div className="flex h-[260px] items-center justify-center text-center text-sm text-ash">Os produtos mais vendidos aparecerão aqui.</div>}</section>
    </div>
    <div className="flex flex-wrap items-center gap-3 print:hidden"><a href={`/api/admin/financeiro/export?de=${period.from}&ate=${period.to}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold"><ArrowDownToLine aria-hidden="true" className="h-4 w-4" />Exportar relatório (Excel)</a><Button variant="outline" onClick={() => window.print()}>Imprimir / PDF</Button></div>
    <details className="rounded-2xl border border-ink/5 bg-white p-5 sm:p-6"><summary className="cursor-pointer font-semibold">Ver composição financeira<span className="mt-1 block text-xs font-normal text-ash">Fretes, descontos, cancelamentos, estornos e repasses</span></summary><dl className="mt-5 grid gap-x-10 sm:grid-cols-2">{breakdown.map(([label, amount]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-ink/5 py-3 text-sm"><dt className="text-ash">{label}</dt><dd className="shrink-0 font-semibold">{formatMoney(amount)}</dd></div>)}</dl><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">O saldo não representa lucro: custos dos produtos, impostos e despesas da loja não estão incluídos. {summary.missingPaymentFees > 0 ? `${summary.missingPaymentFees} pagamentos recebidos ainda estão sem taxa informada. ` : ""}As taxas são registradas conforme o valor efetivamente cobrado; não são estimadas.</p><p className="mt-3 text-xs text-ash">Produtos, fretes e descontos consideram pedidos não cancelados, inclusive pendentes. Todos os totais e gráficos abrangem o período completo.</p></details>
    <details className="rounded-2xl border border-ink/5 bg-white p-5 sm:p-6"><summary className="cursor-pointer font-semibold">Ver pedidos e registrar taxas<span className="mt-1 block text-xs font-normal text-ash">Consulte cada pedido sem sair do relatório</span></summary><div className="mt-5 space-y-3">{!orders.length && <p className="text-sm text-ash">Nenhum pedido nesta página.</p>}{orders.map(order => <details key={order.id} className="rounded-xl border border-ink/10 p-4"><summary className="cursor-pointer text-sm"><span className="inline-flex w-[calc(100%-1.5rem)] flex-wrap items-center justify-between gap-3 align-middle"><span><strong>#{order.number} · {order.customer}</strong><span className="mt-1 block text-xs text-ash">{ORDER_STATUS_LABEL[order.status]} · {paymentLabels[order.paymentStatus] ?? "A confirmar"}</span></span><strong>{formatMoney(order.total)}</strong></span></summary><div className="mt-4 grid gap-5 border-t border-ink/5 pt-4 sm:grid-cols-2"><div className="space-y-2 text-sm text-ash"><p>{new Date(order.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p><p>{paymentDescription(order)}</p><p>Produtos: {formatMoney(order.subtotal)} · Frete: {formatMoney(order.deliveryFee)}</p><p>Desconto: {formatMoney(order.discount)} · Repasse: {formatMoney(order.deliveryPayout)}</p></div><form onSubmit={event => void fee(event, order.id)} className="space-y-2 print:hidden"><label className="block text-sm font-semibold" htmlFor={`fee-${order.id}`}>Taxa de pagamento</label><div className="flex flex-wrap gap-2"><input id={`fee-${order.id}`} key={`${order.id}:${order.paymentFee}`} aria-label={`Taxa do pedido ${order.number}`} name="fee" type="number" min={0} max={order.total} step="0.01" defaultValue={order.paymentFee ?? ""} placeholder="Não informada" className="min-w-0 flex-1 rounded-lg border p-2 text-sm" /><Button size="sm" type="submit" disabled={saving !== null} aria-label={`Salvar taxa do pedido ${order.number}`}>Salvar taxa</Button></div><p className="text-xs text-ash">Deixe em branco se ainda não souber o valor.</p></form></div></details>)}</div></details>
  </div>;
}
