import { expect, it } from "vitest";
import { describeHours, operationDefaults, operationSchema, isWithinStoreHours, storeStatus, validateOrderSchedule } from "./store-hours";
function regular() { const settings = operationDefaults(); settings.acceptingOrders = true; settings.days[2] = { enabled: true, opens: "18:00", closes: "23:00" }; return settings; }
it("does not open a store with missing hours or manual pause", () => {
  expect(storeStatus(null).open).toBe(false);
  expect(storeStatus({ ...regular(), acceptingOrders: false }, new Date("2026-10-27T22:00:00Z")).open).toBe(false);
});
it("uses the configured timezone and includes opening but excludes closing", () => {
  const settings = regular();
  expect(isWithinStoreHours(settings, new Date("2026-10-27T20:59:59Z"))).toBe(false);
  expect(isWithinStoreHours(settings, new Date("2026-10-27T21:00:00Z"))).toBe(true);
  expect(isWithinStoreHours(settings, new Date("2026-10-28T01:59:59Z"))).toBe(true);
  expect(isWithinStoreHours(settings, new Date("2026-10-28T02:00:00Z"))).toBe(false);
});
it("supports overnight shifts across week boundaries without opening early", () => {
  const settings = operationDefaults(); settings.acceptingOrders = true; settings.days[6] = { enabled: true, opens: "18:00", closes: "02:00" };
  expect(isWithinStoreHours(settings, new Date("2026-11-01T04:59:00Z"))).toBe(true);
  expect(isWithinStoreHours(settings, new Date("2026-11-01T05:00:00Z"))).toBe(false);
  expect(isWithinStoreHours(settings, new Date("2026-10-31T04:00:00Z"))).toBe(false);
});
it("rejects invalid ranges, absent active days and impossible estimates", () => {
  expect(operationSchema.safeParse({ ...regular(), deliveryMin: 60, deliveryMax: 20 }).success).toBe(false);
  expect(operationSchema.safeParse({ ...operationDefaults(), acceptingOrders: true }).success).toBe(false);
  expect(operationSchema.safeParse({ ...regular(), timeZone: "invalid" }).success).toBe(false);
});
it("blocks orders while closed and scheduled orders outside service hours", () => {
  const settings = regular(), now = new Date("2026-10-27T22:00:00Z");
  expect(validateOrderSchedule(settings, "2026-10-27T23:00:00Z", now)).toBeNull();
  expect(validateOrderSchedule(settings, "2026-10-28T04:00:00Z", now)).toContain("fora");
  expect(validateOrderSchedule(settings, "2026-10-27T21:00:00Z", now)).toContain("futuro");
  expect(validateOrderSchedule(settings, undefined, new Date("2026-10-27T15:00:00Z"))).toContain("fechada");
});
it("blocks at the order cutoff while preserving legacy closing times", () => {
  const settings = regular(); settings.days[2].ordersUntil = "22:30";
  expect(isWithinStoreHours(settings, new Date("2026-10-28T01:29:59Z"))).toBe(true);
  expect(isWithinStoreHours(settings, new Date("2026-10-28T01:30:00Z"))).toBe(false);
  expect(validateOrderSchedule(settings, "2026-10-28T01:45:00Z", new Date("2026-10-27T22:00:00Z"))).toContain("fora");
  expect(operationSchema.safeParse(settings).success).toBe(true);
  settings.days[2].ordersUntil = "23:30";
  expect(operationSchema.safeParse(settings).success).toBe(false);
});
it("validates cutoffs within overnight shifts including a cutoff before midnight", () => {
  const settings = regular(); settings.days[2] = { enabled: true, opens: "18:00", closes: "02:00", ordersUntil: "01:30" };
  expect(operationSchema.safeParse(settings).success).toBe(true);
  expect(isWithinStoreHours(settings, new Date("2026-10-28T04:29:00Z"))).toBe(true);
  expect(isWithinStoreHours(settings, new Date("2026-10-28T04:30:00Z"))).toBe(false);
  settings.days[2].ordersUntil = "22:00";
  expect(isWithinStoreHours(settings, new Date("2026-10-28T03:30:00Z"))).toBe(false);
  settings.days[2].ordersUntil = "17:00";
  expect(operationSchema.safeParse(settings).success).toBe(false);
});
it("groups configured weekdays without displaying the order cutoff", () => {
  const settings = operationDefaults();
  for (let day = 1; day <= 5; day++) settings.days[day] = { enabled: true, opens: "18:00", closes: "23:00", ordersUntil: "22:30" };
  expect(describeHours(settings)).toBe("Trabalhamos de segunda a sexta, das 18h às 23h.");
  settings.days[0].enabled = true; settings.days[6].enabled = true;
  expect(describeHours(settings)).toBe("Trabalhamos todos os dias, das 18h às 23h.");
});
it("groups Wednesday through Sunday and preserves different or nonconsecutive schedules", () => {
  const settings = operationDefaults();
  for (const day of [3,4,5,6,0]) settings.days[day].enabled = true;
  expect(describeHours(settings)).toBe("Trabalhamos de quarta a domingo, das 18h às 23h.");
  settings.days[6].closes = "02:30";
  expect(describeHours(settings)).toBe("Trabalhamos quarta, quinta, sexta e domingo, das 18h às 23h.\nSábado, das 18h às 2h30 do dia seguinte.");
  expect(describeHours(null)).toBe("Horários ainda não configurados pela loja.");
});
