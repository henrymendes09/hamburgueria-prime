"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveOperationSettings } from "@/actions/operations";
import { WEEK_DAYS, type OperationSettings } from "@/lib/store-hours";
import { Button } from "@/components/ui/button";
export function OperationEditor({ initialValue, configured }: { initialValue: OperationSettings; configured: boolean }) {
  const [value, setValue] = useState(initialValue), [saving, setSaving] = useState(false);
  const router = useRouter();
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try { const result = await saveOperationSettings(value); if (!result.success) toast.error(result.message); else { toast.success(result.message); router.refresh(); } } catch { toast.error("Não foi possível salvar os horários."); } finally { setSaving(false); }
  }
  return <form onSubmit={save} className="mx-auto max-w-4xl space-y-6 normal-case"><div><h1 className="font-display text-3xl">Funcionamento da loja</h1><p className="mt-2 text-sm text-ash">Pedidos são bloqueados fora dos horários. Turnos com fechamento antes da abertura terminam no dia seguinte.</p></div>
    {!configured && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Configure os dias e horários e ative o recebimento de pedidos. Até salvar essa configuração, a loja permanece fechada para novos pedidos.</p>}
    <fieldset disabled={saving} className="space-y-5 rounded-2xl bg-white p-5 sm:p-6">
      <label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={value.acceptingOrders} onChange={event => setValue(current => ({ ...current, acceptingOrders: event.target.checked }))} />Receber pedidos nos horários configurados</label><p className="text-sm text-ash">Desmarque para pausar novos pedidos imediatamente, inclusive durante o expediente.</p>
      <label className="grid gap-2 text-sm font-semibold">Fuso horário<select value={value.timeZone} onChange={event => setValue(current => ({ ...current, timeZone: event.target.value }))} className="rounded-xl border p-3">{["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco", "America/Noronha"].map(zone => <option key={zone}>{zone}</option>)}</select></label>
      <div className="space-y-3">{value.days.map((day, index) => <div key={index} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-3 sm:items-center"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={day.enabled} onChange={event => setValue(current => ({ ...current, days: current.days.map((item, i) => i === index ? { ...item, enabled: event.target.checked } : item) }))} />{WEEK_DAYS[index]}</label>{(["opens", "closes"] as const).map(key => <label key={key} className="grid gap-1 text-xs text-ash">{key === "opens" ? "Abre" : "Fecha"} — {WEEK_DAYS[index]}<input aria-label={`${key === "opens" ? "Abre" : "Fecha"} ${WEEK_DAYS[index]}`} type="time" required disabled={!day.enabled} value={day[key]} onChange={event => setValue(current => ({ ...current, days: current.days.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item) }))} className="min-w-0 rounded-lg border p-2 text-sm text-ink" /></label>)}</div>)}</div>
      <div className="grid gap-4 sm:grid-cols-2">{(["deliveryMin", "deliveryMax"] as const).map(key => <label key={key} className="grid gap-2 text-sm font-semibold">{key === "deliveryMin" ? "Entrega: prazo mínimo (minutos)" : "Entrega: prazo máximo (minutos)"}<input type="number" min={5} max={300} required value={value[key]} onChange={event => setValue(current => ({ ...current, [key]: Number(event.target.value) }))} className="rounded-xl border p-3" /></label>)}</div>
      <Button type="submit">{saving ? "Salvando..." : "Salvar funcionamento"}</Button>
    </fieldset></form>;
}
