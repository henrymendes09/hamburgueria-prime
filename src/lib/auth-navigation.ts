const AUTH_PAGES = new Set(["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/admin/login", "/entregador/login"]);

export function safeAuthDestination(value: string | null | undefined) {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://internal.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://internal.invalid" || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path) || AUTH_PAGES.has(path.replace(/\/+$/, ""))) return "/";
    return url.pathname + url.search + url.hash;
  } catch { return "/"; }
}

export function authPageHref(page: "/login" | "/cadastro", destination: string) {
  const safe = safeAuthDestination(destination);
  return safe === "/" ? page : `${page}?${new URLSearchParams({ callbackUrl: safe })}`;
}

export function navigateAfterSignIn(destination: string) {
  // A new document request reads the new auth cookie and discards anonymous router redirects.
  // The persisted cart remains in localStorage through this navigation.
  window.location.replace(safeAuthDestination(destination));
}
