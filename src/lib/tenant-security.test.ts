import { describe, expect, it } from "vitest";
import { canManageTenant, isSameTenant, resolveTenantSlug } from "./tenant-security";

describe("isolamento multiempresa", () => {
  it("aceita recurso da mesma empresa", () => expect(isSameTenant("prime", "prime")).toBe(true));
  it("recusa recurso de outra empresa", () => expect(isSameTenant("prime", "biel")).toBe(false));
  it("só permite admin da empresa correta", () => {
    expect(canManageTenant({ role: "ADMIN", userTenantId: "prime", targetTenantId: "prime" })).toBe(true);
    expect(canManageTenant({ role: "ADMIN", userTenantId: "prime", targetTenantId: "biel" })).toBe(false);
  });
  it("domínio principal sempre volta para a loja padrão", () => {
    expect(resolveTenantSlug({ pathname: "/", cookieSlug: "biel", defaultSlug: "prime" })).toBe("prime");
  });
  it("resolve subdomínio e mantém cookie fora da raiz", () => {
    expect(resolveTenantSlug({ pathname: "/cardapio", host: "biel.exemplo.com", rootDomain: "exemplo.com", defaultSlug: "prime" })).toBe("biel");
    expect(resolveTenantSlug({ pathname: "/cardapio", cookieSlug: "urbanos", defaultSlug: "prime" })).toBe("urbanos");
  });
});
