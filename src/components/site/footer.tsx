import Link from "next/link";
import { Camera, Share2, MessageCircle, MapPin, Phone, Mail, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="stamp flex h-10 w-10 items-center justify-center rounded-full bg-flame font-display text-lg">
                HP
              </div>
              <span className="font-display text-lg">
                Hamburgueria <span className="text-flame">Prime</span>
              </span>
            </div>
            <p className="text-sm text-paper/60 leading-relaxed">
              Smash burgers artesanais, batatas crocantes e sobremesas — feitos na
              brasa, entregues na sua porta.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-flame transition-colors">
                <Camera className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-flame transition-colors">
                <Share2 className="h-4 w-4" />
              </a>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-flame transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm tracking-wide text-flame mb-4">Navegue</h3>
            <ul className="space-y-2.5 text-sm text-paper/70">
              <li><Link href="/cardapio" className="hover:text-paper transition-colors">Cardápio completo</Link></li>
              <li><Link href="/promocoes" className="hover:text-paper transition-colors">Promoções</Link></li>
              <li><Link href="/sobre" className="hover:text-paper transition-colors">Sobre nós</Link></li>
              <li><Link href="/contato" className="hover:text-paper transition-colors">Fale conosco</Link></li>
              <li><Link href="/perfil/pedidos" className="hover:text-paper transition-colors">Acompanhar pedido</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm tracking-wide text-flame mb-4">Contato</h3>
            <ul className="space-y-3 text-sm text-paper/70">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                Av. das Brasas, 450 — Centro, São José dos Campos/SP
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> (12) 99999-9999
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" /> contato@hamburgueriaprime.com.br
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm tracking-wide text-flame mb-4">Horário</h3>
            <ul className="space-y-2 text-sm text-paper/70">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" /> Ter a Dom
              </li>
              <li className="pl-6">18h às 23h30</li>
              <li className="pl-6 text-paper/40">Segundas fechado</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-paper/40">
          <p>© {new Date().getFullYear()} Hamburgueria Prime. Todos os direitos reservados.</p>
          <p>CNPJ 00.000.000/0001-00</p>
        </div>
      </div>
    </footer>
  );
}
