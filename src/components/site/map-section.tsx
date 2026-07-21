import { MapPin, Phone, Clock } from "lucide-react";

export function MapSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-flame">Onde estamos</span>
        <h2 className="font-display text-3xl text-ink mt-2 sm:text-4xl">Venha nos visitar</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border-2 border-ink/5 aspect-[16/9]">
          <iframe
            title="Localização Hamburgueria Prime"
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=Avenida+Brasil,Sao+Jose+dos+Campos,SP&output=embed"
          />
        </div>

        <div className="flex flex-col justify-center gap-5 rounded-2xl bg-ink p-8 text-paper">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-flame mt-0.5" />
            <p className="text-sm normal-case">Av. das Brasas, 450 — Centro, São José dos Campos/SP</p>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 shrink-0 text-flame mt-0.5" />
            <p className="text-sm normal-case">(12) 99999-9999</p>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 shrink-0 text-flame mt-0.5" />
            <p className="text-sm normal-case">Terça a domingo, 18h às 23h30</p>
          </div>
        </div>
      </div>
    </section>
  );
}
