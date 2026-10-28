import { expect, it } from "vitest";
import { revenueSeries } from "./financial-report";
it("charts all paid valid orders on their Brasília date with zero-filled days and exact cents", () => {
  const order = { createdAt: new Date("2026-10-28T01:00:00Z"), status: "ENTREGUE", paymentStatus: "PAGO", total: 0.1 };
  expect(revenueSeries([order, { ...order, total: 0.2 }, { ...order, status: "CANCELADO", total: 99 }, { ...order, paymentStatus: "PENDENTE", total: 99 }], "2026-10-26", "2026-10-28")).toEqual([
    { date: "26/10", total: 0 }, { date: "27/10", total: 0.3 }, { date: "28/10", total: 0 },
  ]);
});
