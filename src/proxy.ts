import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

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

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*", "/perfil/:path*", "/checkout/:path*", "/entregador/:path*"],
};
