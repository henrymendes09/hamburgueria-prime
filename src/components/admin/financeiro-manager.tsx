"use client";

import { FileSpreadsheet, FileText, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDateTime, ORDER_STATUS_LABEL, PAYMENT_LABEL } from "@/lib/utils";

type OrderRow = {
  number: number;
  customer: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
};

export function FinanceiroManager({
  summary,
  topProducts,
  orders,
}: {
  summary: { totalRevenue: number; totalOrders: number; avgTicket: number };
  topProducts: { name: string; qty: number; revenue: number }[];
  orders: OrderRow[];
}) {
  function exportCSV() {
    const header = ["Pedido", "Cliente", "Status", "Pagamento", "Total", "Data"];
    const rows = orders.map((o) => [
      `#${o.number}`,
      o.customer,
      ORDER_STATUS_LABEL[o.status],
      PAYMENT_LABEL[o.paymentMethod],
      o.total.toFixed(2).replace(".", ","),
      formatDateTime(o.createdAt),
    ]);
    const csvContent = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-hamburgueria-prime-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4 print:hidden">
        <h1 className="font-display text-3xl text-ink">Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
            <FileText className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-2xl bg-white p-5 border-2 border-ink/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white mb-3">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="font-display text-2xl text-ink">{formatMoney(summary.totalRevenue)}</p>
          <p className="text-xs text-ash-light uppercase font-bold">Faturamento total</p>
        </div>
        <div className="rounded-2xl bg-white p-5 border-2 border-ink/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white mb-3">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="font-display text-2xl text-ink">{summary.totalOrders}</p>
          <p className="text-xs text-ash-light uppercase font-bold">Pedidos</p>
        </div>
        <div className="rounded-2xl bg-white p-5 border-2 border-ink/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-flame text-white mb-3">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="font-display text-2xl text-ink">{formatMoney(summary.avgTicket)}</p>
          <p className="text-xs text-ash-light uppercase font-bold">Ticket médio</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border-2 border-ink/5 p-6 mb-8">
        <h2 className="font-display text-lg text-ink mb-4">Produtos mais vendidos</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-ash-light border-b border-ink/5">
              <th className="pb-2">Produto</th>
              <th className="pb-2">Qtd. vendida</th>
              <th className="pb-2">Receita</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.name} className="border-b border-ink/5 last:border-0">
                <td className="py-2 normal-case font-semibold text-ink">{p.name}</td>
                <td className="py-2">{p.qty}</td>
                <td className="py-2">{formatMoney(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl bg-white border-2 border-ink/5 p-6">
        <h2 className="font-display text-lg text-ink mb-4">Pedidos recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ash-light border-b border-ink/5">
                <th className="pb-2">Pedido</th>
                <th className="pb-2">Cliente</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Pagamento</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.number} className="border-b border-ink/5 last:border-0">
                  <td className="py-2 font-semibold">#{o.number}</td>
                  <td className="py-2 normal-case">{o.customer}</td>
                  <td className="py-2 normal-case">{ORDER_STATUS_LABEL[o.status]}</td>
                  <td className="py-2 normal-case">{PAYMENT_LABEL[o.paymentMethod]}</td>
                  <td className="py-2">{formatMoney(o.total)}</td>
                  <td className="py-2 text-xs text-ash-light normal-case">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
