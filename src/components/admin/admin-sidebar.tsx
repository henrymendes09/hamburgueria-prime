"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Tag,
  Users,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/admin/cupons", label: "Cupons", icon: Tag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/financeiro", label: "Financeiro", icon: BarChart3 },
  { href: "/admin/equipe", label: "Equipe", icon: UserCog },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ userName, restaurantSlug }: { userName: string; restaurantSlug?: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-paper lg:flex">
        <div className="flex items-center gap-2 px-6 py-6 border-b border-white/10">
          <div className="stamp flex h-9 w-9 items-center justify-center rounded-full bg-flame font-display text-sm">
            HP
          </div>
          <span className="font-display text-sm">Painel Admin</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-flame text-white" : "text-paper/70 hover:bg-white/5 hover:text-paper"
                )}
              >
                <link.icon className="h-4 w-4" /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            href={restaurantSlug ? `/loja/${restaurantSlug}` : "/"}
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-paper/70 hover:bg-white/5"
          >
            <ExternalLink className="h-4 w-4" /> Ver site
          </Link>
          <div className="px-3 py-2 text-xs text-paper/40 normal-case truncate">{userName}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-paper/70 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto bg-ink px-3 py-3 lg:hidden">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold uppercase",
                active ? "bg-flame text-white" : "bg-white/5 text-paper/70"
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="whitespace-nowrap rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-paper/70"
        >
          Sair
        </button>
      </div>
    </>
  );
}
