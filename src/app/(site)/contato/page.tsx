import { ContactForm } from "@/components/site/contact-form";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { FAQ } from "@/components/site/faq";

export const metadata = {
  title: "Contato",
  description: "Fale com a Hamburgueria Prime — WhatsApp, telefone, email ou formulário.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-flame">Fale conosco</span>
        <h1 className="font-display text-4xl text-ink mt-2 sm:text-5xl">Estamos aqui para ajudar</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border-2 border-ink/5 p-5 hover:border-flame/30 hover:shadow-lg transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-ink">WhatsApp</p>
              <p className="text-sm text-ash normal-case">Resposta rápida, todos os dias</p>
            </div>
          </a>

          <div className="flex items-center gap-4 rounded-2xl border-2 border-ink/5 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-flame/10 text-flame">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-ink">Telefone</p>
              <p className="text-sm text-ash normal-case">(12) 99999-9999</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border-2 border-ink/5 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-flame/10 text-flame">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-ink">Email</p>
              <p className="text-sm text-ash normal-case">contato@hamburgueriaprime.com.br</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border-2 border-ink/5 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-flame/10 text-flame">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-ink">Endereço</p>
              <p className="text-sm text-ash normal-case">Av. das Brasas, 450 — Centro, SJC/SP</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </div>

      <FAQ />
    </div>
  );
}
