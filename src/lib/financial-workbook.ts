import ExcelJS from "exceljs";
import { composition, dateBR, dateTimeBR, orderStatusLabel, PAYMENT_STATUS_LABEL, receiptChart, reportNotes, type FinancialExport } from "./financial-export";
import { paymentDescription } from "./payment-options";

const ink = "171717", red = "E01B22", gray = "F3F4F6", white = "FFFFFF";
const currency = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
const fill = (color: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb: color } });
function merged(sheet: ExcelJS.Worksheet, range: string, value: ExcelJS.CellValue, color = ink, background?: string) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]); cell.value = value;
  cell.font = { name: "Calibri", size: 11, color: { argb: color } };
  cell.alignment = { vertical: "middle", wrapText: true, indent: 1 };
  if (background) cell.fill = fill(background);
  return cell;
}
function sheetBase(workbook: ExcelJS.Workbook, name: string, widths: number[], report: FinancialExport) {
  const sheet = workbook.addWorksheet(name, { views: [{ showGridLines: false }], properties: { defaultRowHeight: 22, tabColor: { argb: red } }, pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 } } });
  sheet.columns = widths.map(width => ({ width }));
  const end = sheet.getColumn(widths.length).letter;
  merged(sheet, `A1:${end}2`, report.name, white, ink).font = { name: "Calibri", size: 20, bold: true, color: { argb: white } };
  merged(sheet, `A3:${end}3`, `${name} · ${dateBR(report.period.from)} a ${dateBR(report.period.to)}`).font = { name: "Calibri", size: 12, bold: true, color: { argb: red } };
  merged(sheet, `A4:${end}4`, `Emitido em ${dateTimeBR(report.generatedAt)} (Brasília)`, "666666");
  sheet.headerFooter.oddFooter = "&LRelatório financeiro · Uso administrativo&R Página &P de &N";
  return sheet;
}
function table(sheet: ExcelJS.Worksheet, name: string, headers: string[], rows: ExcelJS.CellValue[][], moneyColumns: number[]) {
  sheet.addTable({ name, ref: "A6", headerRow: true, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: headers.map(name => ({ name, filterButton: true })), rows });
  sheet.views = [{ state: "frozen", ySplit: 6, showGridLines: false }];
  sheet.pageSetup.printTitlesRow = "1:6";
  sheet.getRow(6).height = 34;
  sheet.getRow(6).eachCell(cell => { cell.fill = fill(ink); cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: white } }; cell.alignment = { wrapText: true, vertical: "middle" }; });
  rows.forEach((_, index) => {
    const row = sheet.getRow(index + 7); row.height = 32;
    row.eachCell(cell => { cell.font = { name: "Calibri", size: 11, color: { argb: ink } }; cell.fill = fill(index % 2 === 0 ? gray : white); cell.alignment = { vertical: "middle", wrapText: true, horizontal: "left", indent: 1 }; });
    moneyColumns.forEach(column => { row.getCell(column).numFmt = currency; row.getCell(column).alignment = { vertical: "middle", horizontal: "right", indent: 1, shrinkToFit: true }; });
  });
  if (!rows.length) { sheet.getCell("A7").value = "Nenhum registro neste período."; sheet.getRow(7).height = 30; }
}
export async function financialWorkbook(report: FinancialExport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = report.name; workbook.created = report.generatedAt; workbook.modified = report.generatedAt;
  const summary = sheetBase(workbook, "Resumo", Array(12).fill(12), report), s = report.summary;
  const cards: [string, number, string, string][] = [["Recebido", s.received, "A", "C"], ["A receber", s.pending, "D", "F"], ["Pedidos", s.totalOrders, "G", "I"], ["Ticket médio", s.avgTicket, "J", "L"]];
  for (const [label, value, start, end] of cards) {
    merged(summary, `${start}7:${end}7`, label, start === "A" ? white : ink, start === "A" ? red : gray).font.bold = true;
    const cell = merged(summary, `${start}8:${end}9`, value, start === "A" ? white : ink, start === "A" ? red : gray);
    cell.font = { name: "Calibri", size: 24, bold: true, color: { argb: start === "A" ? white : ink } }; cell.numFmt = label === "Pedidos" ? "0" : currency;
    cell.alignment = { horizontal: "center", vertical: "middle", shrinkToFit: true };
  }
  merged(summary, "A11:L11", `${s.paidOrders} pedidos pagos e válidos · ${s.cancelledOrders} cancelados ou recusados`, "666666");
  for (let i = 1; i <= 30; i++) summary.getRow(i).height = 16;
  merged(summary, "A13:G13", "COMPOSIÇÃO FINANCEIRA", white, ink).font.bold = true;
  composition(report).forEach(([label, value], i) => { merged(summary, `A${14 + i}:E${14 + i}`, label, ink, i % 2 === 0 ? gray : white); const cell = merged(summary, `F${14 + i}:G${14 + i}`, value, ink, i % 2 === 0 ? gray : white); cell.numFmt = currency; cell.alignment = { horizontal: "right", vertical: "middle" }; });
  reportNotes(report).forEach((note, i) => { merged(summary, `A${25 + i}:L${25 + i}`, note, "666666"); summary.getRow(25 + i).height = 29; });
  const image = workbook.addImage({ base64: `data:image/png;base64,${(await receiptChart(report)).toString("base64")}`, extension: "png" });
  summary.addImage(image, { tl: { col: 7, row: 12 }, ext: { width: 440, height: 110 } });
  merged(summary, "H20:L22", "Explore as abas Pedidos, Recebimentos e Produtos para consultar os detalhes do período.", "666666");
  summary.pageSetup.printArea = "A1:L30"; summary.pageSetup.fitToHeight = 1;
  const orders = sheetBase(workbook, "Pedidos", [12, 30, 24, 20, 29, 18, 18, 18, 18, 18, 18, 25], report);
  table(orders, "PedidosFinanceiros", ["Pedido", "Cliente", "Situação do pedido", "Pagamento", "Forma de pagamento", "Produtos", "Frete", "Desconto", "Total", "Taxa de pagamento", "Repasse de entrega", "Criado em (Brasília)"], report.orders.map(order => [order.number, order.customer, orderStatusLabel(order.status), PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "A confirmar", paymentDescription(order), order.subtotal, order.deliveryFee, order.discount, order.total, order.paymentFee ?? "Não informada", order.deliveryPayout, dateTimeBR(order.createdAt)]), [6,7,8,9,10,11]);
  const daily = sheetBase(workbook, "Recebimentos", [24, 28], report);
  table(daily, "RecebimentosDiarios", ["Dia", "Recebido"], report.revenue.map((day, index) => [dateBR(new Date(Date.parse(report.period.from + "T12:00:00Z") + index * 86400000).toISOString().slice(0, 10)), day.total]), [2]);
  const products = sheetBase(workbook, "Produtos", [46, 22, 28], report);
  table(products, "ProdutosVendidos", ["Produto", "Quantidade vendida", "Valor bruto dos itens"], report.products.map(product => [product.name, product.quantity, product.revenue]), [3]);
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
