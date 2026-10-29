import { expect, it } from "vitest";
import { fastestStopOrder, mapsRouteSections, mapsRoute } from "./driver";
it("optimizes directed travel times from origin without fixing the final stop", () => {
  expect(
    fastestStopOrder([
      [0, 1, 2, 9],
      [1, 0, 40, 1],
      [2, 1, 0, 30],
      [9, 1, 1, 0],
    ]),
  ).toEqual([0, 2, 1]);
});
it("does not accept unreachable stops or unbounded route sizes", () => {
  expect(() =>
    fastestStopOrder([
      [0, 1],
      [null as unknown as number, 0],
    ]),
  ).toThrow();
  expect(() =>
    fastestStopOrder(Array.from({ length: 12 }, () => Array(12).fill(0))),
  ).toThrow();
});
it("preserves every stop across mobile-compatible maps links and resumes at prior destination", () => {
  const stops = Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    address: `Rua ${i}, 10, São Paulo - SP, Brasil`,
  }));
  const sections = mapsRouteSections(stops, "Loja");
  expect(sections.map((s) => s.ids.length)).toEqual([4, 4, 2]);
  expect(sections.flatMap((s) => s.ids)).toEqual(stops.map((s) => s.id));
  expect(new URL(sections[1].url).searchParams.get("origin")).toBe(
    stops[3].address,
  );
  expect(
    new URL(sections[0].url).searchParams.get("waypoints")?.split("|"),
  ).toHaveLength(3);
  expect(
    new URL(mapsRoute(["Rua A & B, 123"])).searchParams.get("destination"),
  ).toBe("Rua A & B, 123");
});
it("splits long encoded addresses without omitting deliveries", () => {
  const stops = Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    address: "Endereço " + i + " " + "á".repeat(110),
  }));
  const sections = mapsRouteSections(stops, "Loja");
  expect(sections.length).toBeGreaterThan(1);
  expect(sections.flatMap((s) => s.ids)).toEqual(["0", "1", "2", "3"]);
  expect(sections.every((s) => s.url.length <= 2048)).toBe(true);
});
