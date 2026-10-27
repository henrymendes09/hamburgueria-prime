import { expect, it } from "vitest";
import { authPageHref, safeAuthDestination } from "./auth-navigation";

it("preserves internal destinations, store context, query and fragment", () => {
  expect(safeAuthDestination("/checkout?loja=minha-loja#entrega")).toBe("/checkout?loja=minha-loja#entrega");
  expect(safeAuthDestination("/perfil/pedidos")).toBe("/perfil/pedidos");
  expect(authPageHref("/cadastro", "/checkout?loja=prime")).toBe("/cadastro?callbackUrl=%2Fcheckout%3Floja%3Dprime");
});

it.each([undefined, null, "", "https://evil.invalid/", "//evil.invalid", "/\\evil.invalid", "javascript:alert(1)", "/login?callbackUrl=/login", "/cadastro", "/%6cogin", "/%2f%2fevil.invalid", "/%5cevil.invalid", "/checkout\n", "/checkout%0a", "/%", "/" + "a".repeat(2050)])("rejects external, malformed or looping callback %s", value => {
  expect(safeAuthDestination(value)).toBe("/");
});
