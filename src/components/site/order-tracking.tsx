"use client";

import { useEffect, useState } from "react";
import { Check, Clock, ChefHat, Bike, PartyPopper, Phone } from "lucide-react";
import { ORDER_STATUS_STEPS, ORDER_STATUS_LABEL, cn } from "@/lib/utils";
import { toast } from "sonner";

const STEP_ICONS: Record<string, typeof Clock> = {
  RECEBIDO: Clock,
  ACEITO: Check,
  PREPARANDO: ChefHat,
  SAIU_PARA_ENTREGA: Bike,
  ENTREGUE: PartyPopper,
};

export function OrderTracking({
  orderId,
  initialStatus,
  entregador,
}: {
  orderId: string;
  initialStatus: string;
  entregador: { name: string; phone: string | null } | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [driver, setDriver] = useState(entregador);

  useEffect(() => {
    if (status === "ENTREGUE" || status === "CANCELADO" || status === "RECUSADO") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== status) {
          setStatus(data.status);
          setDriver(data.entregador ?? driver);
          toast.info(`Status atualizado: ${ORDER_STATUS_LABEL[data.status]}`);
        }
      } catch {
        // rede instável — tenta novamente no próximo ciclo
      }
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, status]);

  if (status === "CANCELADO" || status === "RECUSADO") {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
        <p className="font-display text-xl text-red-600">
          {status === "CANCELADO" ? "Pedido cancelado" : "Pedido recusado"}
        </p>
        <p className="text-sm text-red-500 normal-case mt-1">
          Entre em contato conosco pelo WhatsApp para mais informações.
        </p>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_STEPS.indexOf(status as (typeof ORDER_STATUS_STEPS)[number]);

  return (
    <div>
      <div className="flex items-start justify-between">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[step];
          const isDone = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="flex flex-1 flex-col items-center relative">
              {index > 0 && (
                <div
                  className={cn(
                    "absolute right-1/2 top-5 h-0.5 w-full -z-10 transition-colors duration-700",
                    index <= currentIndex ? "bg-flame" : "bg-ink/10"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                  isDone ? "border-flame bg-flame text-white" : "border-ink/10 bg-white text-ink/30",
                  isCurrent && "scale-110 animate-pulse"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "mt-2 flex min-h-8 w-full items-start justify-center text-center text-[10px] font-bold uppercase leading-tight",
                  isDone ? "text-ink" : "text-ash-light"
                )}
              >
                {ORDER_STATUS_LABEL[step]}
              </span>
            </div>
          );
        })}
      </div>

      {driver && status === "SAIU_PARA_ENTREGA" && (
        <div className="mt-8 flex items-center justify-between rounded-2xl bg-ink p-5 text-paper">
          <div>
            <p className="text-xs text-paper/50 uppercase font-bold">Seu entregador</p>
            <p className="font-display text-lg normal-case">{driver.name}</p>
          </div>
          {driver.phone && (
            <a
              href={`https://wa.me/55${driver.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-flame"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
