import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { composition, dateBR, dateTimeBR, orderStatusLabel, PAYMENT_STATUS_LABEL, receiptChart, reportNotes, type FinancialExport } from "./financial-export";
import { formatMoney } from "./utils";
import { paymentDescription } from "./payment-options";

export async function financialPdf(report: FinancialExport) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const width = 297, margin = 15;
  doc.setProperties({ title: `Relatório financeiro - ${report.name}`, author: report.name, subject: `${dateBR(report.period.from)} a ${dateBR(report.period.to)}` });
  function header(title: string) {
    doc.setFillColor("#171717"); doc.rect(0, 0, width, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor("#171717");
    doc.text(doc.splitTextToSize(report.name, 175)[0], margin, 17);
    doc.setTextColor("#E01B22"); doc.setFontSize(9); doc.text(title.toUpperCase(), width - margin, 16, { align: "right" });
    doc.setTextColor("#666666"); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Período: ${dateBR(report.period.from)} a ${dateBR(report.period.to)}`, margin, 26);
    doc.text(`Emitido: ${dateTimeBR(report.generatedAt)} (Brasília)`, width - margin, 26, { align: "right" });
    doc.setDrawColor("#E5E7EB"); doc.line(margin, 32, width - margin, 32);
  }
  header("Resumo financeiro");
  const s = report.summary;
  const cards = [["Recebido", formatMoney(s.received)], ["A receber", formatMoney(s.pending)], ["Pedidos", String(s.totalOrders)], ["Ticket médio", formatMoney(s.avgTicket)]];
  cards.forEach(([label, value], i) => {
    const x = margin + i * 68;
    doc.setFillColor(i === 0 ? "#171717" : "#F3F4F6"); doc.roundedRect(x, 39, 63, 28, 2, 2, "F");
    doc.setTextColor(i === 0 ? "#FFFFFF" : "#444444"); doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(label, x + 5, 47);
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(value, x + 5, 59);
  });
  doc.setTextColor("#666666"); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text(`${s.paidOrders} pedidos pagos e válidos   |   ${s.cancelledOrders} cancelados ou recusados`, margin, 75);
  autoTable(doc, { startY: 82, margin: { left: margin }, tableWidth: 129, head: [["Composição financeira", "Valor"]], body: composition(report).map(([label, value]) => [label, formatMoney(value)]), theme: "striped", styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: "#171717" }, headStyles: { fillColor: "#171717", textColor: "#FFFFFF" }, alternateRowStyles: { fillColor: "#F3F4F6" }, columnStyles: { 0: { cellWidth: 94 }, 1: { cellWidth: 35, halign: "right" } } });
  doc.addImage(await receiptChart(report), "PNG", 153, 80, 129, 32.25);
  autoTable(doc, { startY: 121, margin: { left: 153 }, tableWidth: 129, head: [["Mais vendidos (pedidos pagos)", "Qtd.", "Bruto"]], body: report.products.length ? report.products.slice(0, 5).map(product => [product.name, String(product.quantity), formatMoney(product.revenue)]) : [["Nenhuma venda recebida no período.", "—", "—"]], styles: { font: "helvetica", fontSize: 8, cellPadding: 2, overflow: "ellipsize" }, headStyles: { fillColor: "#171717", textColor: "#FFFFFF" }, alternateRowStyles: { fillColor: "#F3F4F6" }, columnStyles: { 0: { cellWidth: 74 }, 1: { cellWidth: 15, halign: "right" }, 2: { cellWidth: 40, halign: "right" } } });
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor("#666666");
  let noteY = 172;
  reportNotes(report).forEach(note => { const lines = doc.splitTextToSize(note, 267); doc.text(lines, margin, noteY); noteY += lines.length * 3.5 + 1; });
  if (report.orders.length) {
    doc.addPage();
    autoTable(doc, {
      startY: 40, margin: { top: 40, bottom: 18, left: margin, right: margin },
      head: [["Pedido", "Cliente / data (Brasília)", "Situação", "Pagamento", "Forma", "Total", "Taxa", "Repasse"]],
      body: report.orders.map(order => [`#${order.number}`, `${order.customer}\n${dateTimeBR(order.createdAt)}`, orderStatusLabel(order.status), PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "A confirmar", paymentDescription(order), formatMoney(order.total), order.paymentFee === null ? "Não informada" : formatMoney(order.paymentFee), formatMoney(order.deliveryPayout)]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2.8, overflow: "linebreak", valign: "middle", textColor: "#171717" },
      headStyles: { fillColor: "#171717", textColor: "#FFFFFF", fontStyle: "bold" }, alternateRowStyles: { fillColor: "#F3F4F6" }, rowPageBreak: "avoid",
      columnStyles: { 0: { cellWidth: 17 }, 1: { cellWidth: 57 }, 2: { cellWidth: 33 }, 3: { cellWidth: 25 }, 4: { cellWidth: 48 }, 5: { cellWidth: 29, halign: "right" }, 6: { cellWidth: 29, halign: "right" }, 7: { cellWidth: 29, halign: "right" } },
      didDrawPage: () => header("Pedidos do período"),
    });
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setDrawColor("#E5E7EB"); doc.line(margin, 197, width - margin, 197);
    doc.setTextColor("#666666"); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("Relatório financeiro · Uso administrativo", margin, 203);
    doc.text(`Página ${i} de ${pages}`, width - margin, 203, { align: "right" });
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
