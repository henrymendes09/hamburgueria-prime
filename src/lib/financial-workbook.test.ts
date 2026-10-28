import { expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
vi.mock("./prisma", () => ({ prisma: {} }));
import { buildFinancialExport, type ExportOrder } from "./financial-export";
import { financialPeriod } from "./financial-report";
import { financialWorkbook } from "./financial-workbook";

const order: ExportOrder = { number: 1, customer: '=HYPERLINK("https://example.invalid")', createdAt: new Date("2026-10-02T01:00:00Z"), status: "ENTREGUE", paymentStatus: "PAGO", paymentMethod: "DINHEIRO", paymentCardBrand: null, deliveryType: "RETIRADA", total: 19.9, subtotal: 20, deliveryFee: 0, discount: 0.1, deliveryPayout: 0, paymentFee: null, items: [{ name: "Porção de teste", quantity: 1, unitPrice: 20 }] };
it("exports a real styled workbook with every order, numeric money and literal untrusted text", async () => {
  const report = buildFinancialExport("Loja de teste", financialPeriod("2026-10-01", "2026-10-28"), Array.from({ length: 61 }, (_, i) => ({ ...order, number: i + 1 })));
  const bytes = await financialWorkbook(report), workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(["Resumo", "Pedidos", "Recebimentos", "Produtos"]);
  expect(workbook.getWorksheet("Resumo")!.getCell("A8").value).toBe(1213.9);
  const orders = workbook.getWorksheet("Pedidos")!;
  expect(orders.getCell("A67").value).toBe(61);
  expect(orders.getCell("B7").type).toBe(ExcelJS.ValueType.String);
  expect(orders.getCell("B7").value).toBe(order.customer);
  expect(orders.getCell("I7").value).toBe(19.9);
  expect(orders.getCell("I7").numFmt).toContain('"R$"');
  expect(orders.getCell("J7").value).toBe("Não informada");
  expect(orders.getCell("C7").value).toBe("Entregue");
  expect(orders.views[0].state).toBe("frozen");
  expect(orders.getColumn("B").width).toBeGreaterThanOrEqual(30);
  expect(workbook.getWorksheet("Resumo")!.getImages()).toHaveLength(1);
});
it("keeps empty periods readable without creating fictitious sales", async () => {
  const report = buildFinancialExport("Loja", financialPeriod("2026-10-01", "2026-10-01"), []);
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await financialWorkbook(report) as unknown as ExcelJS.Buffer);
  expect(workbook.getWorksheet("Resumo")!.getCell("A8").value).toBe(0);
  expect(workbook.getWorksheet("Pedidos")!.getCell("A7").value).toBe("Nenhum registro neste período.");
  expect(workbook.getWorksheet("Recebimentos")!.getCell("B7").value).toBe(0);
});
it("excludes cancelled and pending orders from product rankings and paid daily totals", () => {
  const report = buildFinancialExport("Loja", financialPeriod("2026-10-01", "2026-10-02"), [order, { ...order, status: "CANCELADO" }, { ...order, paymentStatus: "PENDENTE" }]);
  expect(report.products).toEqual([{ name: "Porção de teste", quantity: 1, revenue: 20 }]);
  expect(report.revenue).toEqual([{ date: "01/10", total: 19.9 }, { date: "02/10", total: 0 }]);
});
