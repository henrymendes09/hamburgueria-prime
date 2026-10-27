import { expect, it } from "vitest";
import { operationDefaults, operationSchema, isWithinStoreHours, storeStatus, validateOrderSchedule } from "./store-hours";
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
