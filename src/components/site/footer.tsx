import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import type { Restaurant } from "@prisma/client";
import { MessageCircle, MapPin, Phone, Mail, Clock } from "lucide-react";

export function Footer({ restaurant }: { restaurant: Restaurant }) {
  const initials = restaurant.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <footer className="bg-ink text-paper">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="stamp flex h-10 w-10 items-center justify-center overflow-hidden rounded-full font-display text-lg" style={{ backgroundColor: restaurant.primaryColor }}>
              {restaurant.logoUrl ? <img src={restaurant.logoUrl} alt={`Logo ${restaurant.name}`} className="h-full w-full object-cover" /> : initials}
            </div>
            <span className="font-display text-lg">{restaurant.name}</span>
          </div>
          <p className="text-sm leading-relaxed text-paper/60">{restaurant.description || "Pedidos preparados com qualidade e entregues para você."}</p>
          {restaurant.whatsapp && <a href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="mt-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/5"><MessageCircle className="h-4 w-4" /></a>}
        </div>
        <div>
          <h3 className="mb-4 font-display text-sm tracking-wide" style={{ color: restaurant.primaryColor }}>Navegue</h3>
          <ul className="space-y-2.5 text-sm text-paper/70">
            <li><Link href="/cardapio">Cardápio completo</Link></li>
            <li><Link href="/promocoes">Promoções</Link></li>
            <li><Link href="/sobre">Sobre nós</Link></li>
            <li><Link href="/contato">Fale conosco</Link></li>
            <li><Link href="/perfil/pedidos">Acompanhar pedido</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-display text-sm tracking-wide" style={{ color: restaurant.primaryColor }}>Contato</h3>
          <ul className="space-y-3 text-sm text-paper/70">
            {restaurant.address && <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{restaurant.address}</li>}
            {restaurant.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />{restaurant.phone}</li>}
            {restaurant.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" />{restaurant.email}</li>}
            {!restaurant.address && !restaurant.phone && !restaurant.email && <li>Dados de contato ainda não informados.</li>}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-display text-sm tracking-wide" style={{ color: restaurant.primaryColor }}>Horário</h3>
          <p className="flex items-start gap-2 text-sm text-paper/70"><Clock className="h-4 w-4 shrink-0" />{restaurant.businessHours || "Horário não informado"}</p>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-paper/40 sm:flex-row">
        <p>© {new Date().getFullYear()} {restaurant.name}. Todos os direitos reservados.</p>
        {restaurant.cnpj && <p>CNPJ {restaurant.cnpj}</p>}
      </div>
    </div>
  </footer>;
}
