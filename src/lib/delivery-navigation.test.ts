import { it, expect, vi } from "vitest";
import { navigationDestination, mapsRouteSections } from "./driver";
import { exactDeliveryPoint } from "./delivery-navigation";
const address = {
  street: "Rua Córrego do Bengalar",
  number: "100",
  neighborhood: "Altos da Vila Paiva",
  city: "São José dos Campos",
  state: "SP",
  cep: "12213-094",
  complement: null,
  reference: null,
};
it("uses verified Google street alias without the misleading postal code", () => {
  expect(navigationDestination(address)).toBe(
    "Rua Córrego Bengalar, 100, Altos da Vila Paiva, São José dos Campos, SP, Brasil",
  );
  expect(navigationDestination({ ...address, city: "Outra cidade" })).toContain(
    "Rua Córrego do Bengalar",
  );
});
it("uses confirmed pins and groups same-location deliveries without losing orders", () => {
  const target = navigationDestination({
    ...address,
    navigationLatitude: -23.14,
    navigationLongitude: -45.91,
  });
  expect(target).toBe("-23.14,-45.91");
  const sections = mapsRouteSections([
    { id: "a", address: target },
    { id: "b", address: target },
  ]);
  expect(sections[0].ids).toEqual(["a", "b"]);
  expect(new URL(sections[0].url).searchParams.get("waypoints")).toBeNull();
});
it("never falls back to legacy city/CEP coordinates for stops", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json([]));
  try {
    expect(
      await exactDeliveryPoint({
        ...address,
        latitude: -23,
        longitude: -45,
      } as typeof address),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    fetchMock.mockRestore();
  }
});
