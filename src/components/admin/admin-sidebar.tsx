"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  MessageSquare,
  FilePenLine,
  Clock,
  History,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/cozinha", label: "Cozinha", icon: ChefHat },
  { href: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/admin/cupons", label: "Cupons", icon: Tag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/mensagens", label: "Mensagens", icon: MessageSquare },
  { href: "/admin/conteudo", label: "Conteúdo do site", icon: FilePenLine },
  { href: "/admin/funcionamento", label: "Funcionamento", icon: Clock },
  { href: "/admin/historico", label: "Histórico de ações", icon: History },
  { href: "/admin/financeiro", label: "Financeiro", icon: BarChart3 },
  { href: "/admin/equipe", label: "Equipe", icon: UserCog },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({
  userName,
  restaurantSlug,
}: {
  userName: string;
  restaurantSlug?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-paper lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 px-5 border-b border-white/10">
          <div className="stamp flex h-8 w-8 items-center justify-center rounded-full bg-flame font-display text-sm">
            HP
          </div>
          <span className="font-display text-sm">Painel Admin</span>
        </div>

        <nav
          aria-label="Módulos administrativos"
          className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-3 py-2"
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex h-[clamp(24px,4.5dvh,36px)] items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-flame text-white"
                    : "text-paper/70 hover:bg-white/5 hover:text-paper",
                )}
              >
                <link.icon className="h-4 w-4" /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-3 py-2">
          <Link
            href={restaurantSlug ? `/loja/${restaurantSlug}` : "/"}
            target="_blank"
            className="flex h-8 items-center gap-3 rounded-lg px-3 text-xs font-semibold text-paper/70 hover:bg-white/5"
          >
            <ExternalLink className="h-4 w-4" /> Ver site
          </Link>
          <div className="px-3 py-1 text-[11px] text-paper/40 normal-case truncate">
            {userName}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex h-8 w-full items-center gap-3 rounded-lg px-3 text-xs font-semibold text-paper/70 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-30 flex items-center gap-3 bg-ink px-3 py-2 lg:hidden">
        <label className="min-w-0 flex-1 text-xs text-paper/70">
          <span className="sr-only">Módulo administrativo</span>
          <select
            aria-label="Módulo administrativo"
            value={
              LINKS.some((link) => link.href === pathname) ? pathname : "/admin"
            }
            onChange={(event) => router.push(event.target.value)}
            className="min-h-11 w-full rounded-lg border-white/15 bg-ink-soft px-3 text-sm font-semibold text-paper"
          >
            {LINKS.map((link) => (
              <option key={link.href} value={link.href}>
                {link.label}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="min-h-11 shrink-0 rounded-lg bg-white/5 px-3 text-xs font-bold uppercase text-paper/70"
        >
          Sair
        </button>
      </div>
    </>
  );
}
