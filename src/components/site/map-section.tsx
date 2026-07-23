import { MapPin, Phone, Clock } from "lucide-react";

export function MapSection({ name, address, phone, businessHours, primaryColor }: { name: string; address?: string | null; phone?: string | null; businessHours?: string | null; primaryColor: string }) {
  if (!address && !phone && !businessHours) return null;
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <div className="mb-10 text-center"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>Onde estamos</span><h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Venha nos visitar</h2></div>
    <div className="grid gap-6 lg:grid-cols-3">
      {address && <div className="aspect-[16/9] overflow-hidden rounded-2xl border-2 border-ink/5 lg:col-span-2"><iframe title={`Localização ${name}`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} /></div>}
      <div className="flex flex-col justify-center gap-5 rounded-2xl bg-ink p-8 text-paper">
        {address && <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} /><p className="text-sm normal-case">{address}</p></div>}
        {phone && <div className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} /><p className="text-sm normal-case">{phone}</p></div>}
        {businessHours && <div className="flex items-start gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} /><p className="text-sm normal-case">{businessHours}</p></div>}
      </div>
    </div>
  </section>;
}
