"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, ShoppingBag, User, X, LogOut, Package, Heart, MapPin, LayoutDashboard } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/promocoes", label: "Promoções" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all",
        scrolled ? "bg-ink shadow-lg" : "bg-ink/95"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="stamp flex h-11 w-11 items-center justify-center rounded-full bg-flame text-paper font-display text-xl">
            HP
          </div>
          <span className="font-display text-xl text-paper hidden sm:block">
            Hamburgueria <span className="text-flame">Prime</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide text-paper/70 hover:text-paper hover:bg-white/5 transition-colors",
                pathname === link.href && "text-flame"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 px-3 py-2 text-paper transition-colors">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block text-sm font-semibold max-w-[100px] truncate">
                    {session.user.name?.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/perfil"><User className="h-4 w-4" /> Meu perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/perfil/pedidos"><Package className="h-4 w-4" /> Meus pedidos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/perfil/favoritos"><Heart className="h-4 w-4" /> Favoritos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/perfil/enderecos"><MapPin className="h-4 w-4" /> Endereços</Link>
                </DropdownMenuItem>
                {session.user.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin"><LayoutDashboard className="h-4 w-4" /> Painel admin</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="border-paper/30 text-paper hover:bg-paper hover:text-ink hidden sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
          )}

          <button
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-flame text-white hover:brightness-105 transition-all"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-paper text-[11px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </button>

          <button
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-paper"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden bg-ink border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide text-paper/80 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          {!session?.user && (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide text-flame"
            >
              Login
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
