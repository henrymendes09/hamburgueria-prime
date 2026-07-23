export function isSameTenant(resourceTenantId: string | null | undefined, activeTenantId: string) {
  return Boolean(resourceTenantId && resourceTenantId === activeTenantId);
}

export function canManageTenant(input: {
  role?: string | null;
  userTenantId?: string | null;
  targetTenantId: string;
  blocked?: boolean;
}) {
  return input.role === "ADMIN" && !input.blocked && isSameTenant(input.userTenantId, input.targetTenantId);
}

export function resolveTenantSlug(input: {
  pathname: string;
  querySlug?: string | null;
  cookieSlug?: string | null;
  host?: string | null;
  rootDomain?: string | null;
  defaultSlug: string;
}) {
  if (input.pathname === "/") return input.querySlug || input.defaultSlug;
  const host = input.host?.split(":")[0].toLowerCase();
  const root = input.rootDomain?.toLowerCase();
  if (host && root && host.endsWith(`.${root}`)) return host.slice(0, -(root.length + 1));
  return input.querySlug || input.cookieSlug || input.defaultSlug;
}
