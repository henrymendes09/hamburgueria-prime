"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveOperationSettings } from "@/actions/operations";
import { WEEK_DAYS, type OperationSettings } from "@/lib/store-hours";
import { Button } from "@/components/ui/button";
export function OperationEditor({
  initialValue,
  configured,
}: {
  initialValue: OperationSettings;
  configured: boolean;
}) {
  const [value, setValue] = useState(initialValue),
    [saving, setSaving] = useState(false);
  const router = useRouter();
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveOperationSettings(value);
      if (!result.success) toast.error(result.message);
      else {
        toast.success(result.message);
        router.refresh();
      }
    } catch {
      toast.error("Não foi possível salvar os horários.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="mx-auto max-w-5xl space-y-6 normal-case">
      <div>
        <h1 className="font-display text-3xl">Funcionamento da loja</h1>
        <p className="mt-2 text-sm text-ash">
          Defina o expediente e até que horas aceita pedidos em cada dia. Após
          esse limite, novos pedidos são bloqueados automaticamente. Horários
          após a meia-noite pertencem ao dia seguinte.
        </p>
      </div>
      {!configured && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Configure os dias e horários e ative o recebimento de pedidos. Até
          salvar essa configuração, a loja permanece fechada para novos pedidos.
        </p>
      )}
      <fieldset
        disabled={saving}
        className="space-y-5 rounded-2xl bg-white p-5 sm:p-6"
      >
        <label className="grid gap-2 text-sm font-bold">
          Recebimento de pedidos
          <select
            aria-label="Recebimento de pedidos"
            value={value.acceptingOrders ? "automatic" : "paused"}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                acceptingOrders: event.target.value === "automatic",
              }))
            }
            className="rounded-xl border bg-white p-3"
          >
            <option value="automatic">
              Abrir e fechar automaticamente pelos horários
            </option>
            <option value="paused">Pausar todos os pedidos manualmente</option>
          </select>
        </label>
        <p
          role="status"
          className={`rounded-xl p-3 text-sm font-semibold ${value.acceptingOrders ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
        >
          {value.acceptingOrders
            ? "Abertura automática ativada. A loja recebe pedidos durante os horários configurados abaixo."
            : "Pedidos pausados manualmente. A loja permanece fechada para pedidos, mesmo dentro do expediente. Selecione a abertura automática para voltar a receber."}
        </p>
        <label className="grid gap-2 text-sm font-semibold">
          Fuso horário
          <select
            value={value.timeZone}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                timeZone: event.target.value,
              }))
            }
            className="rounded-xl border p-3"
          >
            {[
              "America/Sao_Paulo",
              "America/Manaus",
              "America/Rio_Branco",
              "America/Noronha",
            ].map((zone) => (
              <option key={zone}>{zone}</option>
            ))}
          </select>
        </label>
        <div className="space-y-3">
          {value.days.map((day, index) => (
            <div
              key={index}
              className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-center ${day.enabled ? "border-ink/10" : "border-transparent bg-ink/[0.03]"}`}
            >
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      days: current.days.map((item, i) =>
                        i === index
                          ? { ...item, enabled: event.target.checked }
                          : item,
                      ),
                    }))
                  }
                />
                {WEEK_DAYS[index]}
              </label>
              {(["opens", "closes", "ordersUntil"] as const).map((key) => {
                const label =
                  key === "opens"
                    ? "Abre"
                    : key === "closes"
                      ? "Fecha"
                      : "Aceitar pedidos até";
                return (
                  <label
                    key={key}
                    className={`grid gap-1 text-xs ${key === "ordersUntil" ? "font-bold text-flame" : "text-ash"}`}
                  >
                    {label}
                    <input
                      aria-label={`${label} ${WEEK_DAYS[index]}`}
                      type="time"
                      required
                      disabled={!day.enabled}
                      value={day[key] ?? day.closes}
                      onChange={(event) =>
                        setValue((current) => ({
                          ...current,
                          days: current.days.map((item, i) =>
                            i === index
                              ? { ...item, [key]: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      className="min-w-0 rounded-lg border bg-white p-2 text-sm text-ink disabled:opacity-40"
                    />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <p className="rounded-xl bg-red-50 p-3 text-sm text-ink">
          Exemplo: a loja fecha às 23:00, mas pode aceitar pedidos somente até
          22:30. Se não alterar o limite, ele acompanha o fechamento.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["deliveryMin", "deliveryMax"] as const).map((key) => (
            <label key={key} className="grid gap-2 text-sm font-semibold">
              {key === "deliveryMin"
                ? "Entrega: prazo mínimo (minutos)"
                : "Entrega: prazo máximo (minutos)"}
              <input
                type="number"
                min={5}
                max={300}
                required
                value={value[key]}
                onChange={(event) =>
                  setValue((current) => ({
                    ...current,
                    [key]: Number(event.target.value),
                  }))
                }
                className="rounded-xl border p-3"
              />
            </label>
          ))}
        </div>
        <Button type="submit">
          {saving ? "Salvando..." : "Salvar funcionamento"}
        </Button>
      </fieldset>
    </form>
  );
}
