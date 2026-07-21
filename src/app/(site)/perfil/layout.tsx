import Link from "next/link";
import { User, Package, Heart, MapPin, CreditCard } from "lucide-react";

const TABS = [
  { href: "/perfil", label: "Meu perfil", icon: User },
  { href: "/perfil/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/perfil/favoritos", label: "Favoritos", icon: Heart },
  { href: "/perfil/enderecos", label: "Endereços", icon: MapPin },
  { href: "/perfil/cartoes", label: "Cartões", icon: CreditCard },
];

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-ink mb-8 sm:text-4xl">Minha conta</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors"
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
