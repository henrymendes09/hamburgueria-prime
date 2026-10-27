import { expect, it } from "vitest";
import { summarizeFinancialOrders, financialPeriod, csvCell } from "./financial-report";
const order = { status: "ENTREGUE", paymentStatus: "PAGO", paymentMethod: "CREDITO", total: 29.9, subtotal: 30, deliveryFee: 4.9, discount: 5, deliveryPayout: 3, paymentFee: 0.9 };
it("separates received, pending, cancelled and refunded amounts without treating orders as cash", () => {
  const report = summarizeFinancialOrders([order, { ...order, status: "RECEBIDO", paymentStatus: "PENDENTE", paymentFee: null }, { ...order, status: "CANCELADO", paymentStatus: "ESTORNADO", paymentFee: 0 }, { ...order, status: "RECUSADO", paymentStatus: "PENDENTE", paymentFee: null }]);
  expect(report.received).toBe(29.9); expect(report.pending).toBe(29.9); expect(report.refunded).toBe(29.9); expect(report.cancelled).toBe(59.8);
  expect(report.discounts).toBe(10); expect(report.deliveryFees).toBe(9.8); expect(report.driverPayouts).toBe(3); expect(report.netAfterKnownCosts).toBe(26);
});
it("does not invent missing provider fees", () => {
  const report = summarizeFinancialOrders([{ ...order, paymentFee: null }, { ...order, paymentMethod: "DINHEIRO", paymentFee: null }]);
  expect(report.missingPaymentFees).toBe(1); expect(report.paymentFees).toBe(0);
});
it("covers a complete Brazilian calendar day and rejects invalid dates and large ranges", () => {
  const period = financialPeriod("2026-10-01", "2026-10-27");
  expect(period.start.toISOString()).toBe("2026-10-01T03:00:00.000Z"); expect(period.end.toISOString()).toBe("2026-10-28T03:00:00.000Z");
  expect(financialPeriod("2026-02-31", "2026-03-01").invalid).toBe(true);
  expect(financialPeriod("2020-01-01", "2026-01-01").invalid).toBe(true);
});
it("escapes spreadsheet formulas, delimiters, quotes and line breaks", () => {
  expect(csvCell(41.9)).toBe('"41,9"');
  expect(csvCell(-3.5)).toBe('"-3,5"');
  expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"');
  expect(csvCell('Cliente; "Nome"\n')).toBe('"Cliente; ""Nome""\n"');
});
