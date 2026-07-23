import { ContactForm } from "@/components/site/contact-form";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { FAQ } from "@/components/site/faq";
import { getPublicRestaurant } from "@/lib/tenant";

export const metadata = { title: "Contato" };

export default async function ContatoPage() {
  const restaurant = await getPublicRestaurant();
  return <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
    <div className="mb-12 text-center"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: restaurant.primaryColor }}>Fale conosco</span><h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Estamos aqui para ajudar</h1></div>
    <div className="grid gap-10 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        {restaurant.whatsapp && <ContactItem href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`} icon={MessageCircle} label="WhatsApp" value={restaurant.whatsapp} />}
        {restaurant.phone && <ContactItem icon={Phone} label="Telefone" value={restaurant.phone} />}
        {restaurant.email && <ContactItem icon={Mail} label="E-mail" value={restaurant.email} />}
        {restaurant.address && <ContactItem icon={MapPin} label="Endereço" value={restaurant.address} />}
        {!restaurant.whatsapp && !restaurant.phone && !restaurant.email && !restaurant.address && <p className="rounded-2xl bg-zinc-100 p-5 text-zinc-600">A loja ainda não informou os dados de contato.</p>}
      </div>
      <div className="lg:col-span-3"><ContactForm /></div>
    </div>
    <FAQ />
  </div>;
}

function ContactItem({ href, icon: Icon, label, value }: { href?: string; icon: typeof Phone; label: string; value: string }) {
  const content = <><div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100"><Icon className="h-6 w-6" /></div><div><p className="font-bold text-ink">{label}</p><p className="text-sm normal-case text-ash">{value}</p></div></>;
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border-2 border-ink/5 p-5">{content}</a> : <div className="flex items-center gap-4 rounded-2xl border-2 border-ink/5 p-5">{content}</div>;
}
