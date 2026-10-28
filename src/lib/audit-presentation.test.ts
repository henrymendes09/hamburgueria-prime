import { expect, it } from "vitest";
import { auditChanges } from "./audit-presentation";
import { operationDefaults } from "./store-hours";
it("presents only changed business values in Portuguese without exposing identifiers or secrets", () => {
  const changes = auditChanges({ price: 10, passwordHash: "secret-old", categoryId: "cuid-old" }, { price: 12, passwordHash: "secret-new", categoryId: "cuid-new" }, ["price", "passwordHash", "categoryId", "unknownCode"]);
  expect(changes[0]).toEqual({ label: "Preço", before: expect.stringContaining("10,00"), after: expect.stringContaining("12,00") });
  expect(JSON.stringify(changes)).not.toMatch(/secret-|cuid-|unknownCode|passwordHash/);
});
it("describes historical schedules and new order cutoffs as readable day changes", () => {
  const before = operationDefaults(); before.days[3] = { enabled: true, opens: "18:00", closes: "23:00" };
  const after = structuredClone(before); after.days[3].ordersUntil = "22:30";
  const changes = auditChanges({ operationSettings: before }, { operationSettings: after }, ["operationSettings"]);
  expect(changes).toEqual([{ label: "Quarta-feira", before: "18:00 às 23:00; pedidos até 23:00", after: "18:00 às 23:00; pedidos até 22:30" }]);
});
it("shows FAQ questions and answers instead of JSON", () => {
  const changes = auditChanges({ siteContent: { faqs: [{ q: "Entrega?", a: "Sim" }] } }, { siteContent: { faqs: [{ q: "Entrega?", a: "Sim, até 5 km" }] } }, ["siteContent"]);
  expect(changes).toEqual([{ label: "Pergunta frequente 1", before: "Entrega? — Sim", after: "Entrega? — Sim, até 5 km" }]);
});
