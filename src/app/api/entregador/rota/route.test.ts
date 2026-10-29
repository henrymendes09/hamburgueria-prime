import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  find: vi.fn(),
  store: vi.fn(),
  limit: vi.fn(),
  geocode: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findMany: m.find }, restaurant: { findUnique: m.store } },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: m.limit }));
vi.mock("@/lib/delivery", () => ({ geocodeAddress: m.geocode }));
import { POST } from "./route";
const request = (ids = ["owned"]) =>
  new Request("https://example.com/api/entregador/rota", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      "content-type": "application/json",
    },
    body: JSON.stringify({ ids, origin: { latitude: -23, longitude: -46 } }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({
    user: { id: "driver", restaurantId: "store", role: "ENTREGADOR" },
  });
  m.limit.mockResolvedValue({ success: true });
  m.store.mockResolvedValue({ address: "Loja", storeCep: "12240030" });
});
it("denies anonymous, blocked and non-driver accounts", async () => {
  for (const user of [
    null,
    { id: "x", role: "ADMIN", restaurantId: "store" },
    { id: "x", role: "ENTREGADOR", restaurantId: "store", blocked: true },
  ]) {
    m.auth.mockResolvedValue({ user });
    expect((await POST(request())).status).toBe(401);
  }
  expect(m.find).not.toHaveBeenCalled();
});
it("rejects cross-origin and duplicate or oversized stop lists", async () => {
  expect(
    (
      await POST(
        new Request("https://example.com/api/entregador/rota", {
          method: "POST",
          headers: { origin: "https://evil.invalid" },
        }),
      )
    ).status,
  ).toBe(403);
  expect((await POST(request(["a", "a"]))).status).toBe(400);
  expect(
    (await POST(request(Array.from({ length: 11 }, (_, i) => String(i)))))
      .status,
  ).toBe(400);
  expect(m.find).not.toHaveBeenCalled();
});
it("never routes another driver, restaurant, pickup or completed delivery", async () => {
  m.find.mockResolvedValue([]);
  expect((await POST(request(["foreign"]))).status).toBe(409);
  expect(m.find).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: { in: ["foreign"] },
        restaurantId: "store",
        entregadorId: "driver",
        deliveryType: "ENTREGA",
        status: { in: ["PREPARANDO", "SAIU_PARA_ENTREGA"] },
      },
    }),
  );
  expect(m.geocode).not.toHaveBeenCalled();
});
it("optimizes owned deliveries with the road service and returns no customer personal data", async () => {
  m.find.mockResolvedValue([
    { id: "owned", address: { latitude: -23.1, longitude: -46.1 } },
  ]);
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      code: "Ok",
      durations: [
        [0, 60],
        [60, 0],
      ],
    }),
  );
  try {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ids: ["owned"],
      origin: "-23,-46",
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  } finally {
    fetchMock.mockRestore();
  }
});
it("fails visibly when a road segment is unreachable rather than claiming optimization", async () => {
  m.find.mockResolvedValue([
    { id: "owned", address: { latitude: -23.1, longitude: -46.1 } },
  ]);
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      code: "Ok",
      durations: [
        [0, null],
        [60, 0],
      ],
    }),
  );
  try {
    expect((await POST(request())).status).toBe(503);
  } finally {
    fetchMock.mockRestore();
  }
});
