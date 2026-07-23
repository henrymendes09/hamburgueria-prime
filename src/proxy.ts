import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenantSlug } from "@/lib/tenant-security";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const requestHeaders = new Headers(req.headers);
  const requestedRestaurant = req.nextUrl.searchParams.get("loja");
  const rootRestaurant = resolveTenantSlug({
    pathname,
    querySlug: requestedRestaurant,
    cookieSlug: req.cookies.get("hp_restaurant")?.value,
    host: req.headers.get("host"),
    rootDomain: process.env.PLATFORM_ROOT_DOMAIN,
    defaultSlug: "hamburgueria-prime",
  });
  if (pathname === "/") requestHeaders.set("x-restaurant-slug", rootRestaurant);

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAccountRoute = pathname.startsWith("/perfil") || pathname.startsWith("/checkout");
  const isEntregadorRoute = pathname.startsWith("/entregador") && pathname !== "/entregador/login";
  const isPlatformRoute = pathname.startsWith("/super-admin");

  if (isPlatformRoute && !session?.user?.isPlatformAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdminRoute) {
    if (!session?.user || session.user.role !== "ADMIN") {
      const url = new URL("/admin/login", req.url);
      return NextResponse.redirect(url);
    }
  }

  if (isEntregadorRoute) {
    if (!session?.user || session.user.role !== "ENTREGADOR") {
      const url = new URL("/entregador/login", req.url);
      return NextResponse.redirect(url);
    }
  }

  if (isAccountRoute) {
    if (!session?.user) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (session.user.blocked) {
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "CONTA_BLOQUEADA");
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (pathname === "/") {
    response.cookies.set("hp_restaurant", rootRestaurant, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
