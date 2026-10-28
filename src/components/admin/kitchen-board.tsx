"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChefHat, Clock, Maximize, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/orders";
import {
  enableNotificationSound,
  playNotificationSound,
} from "@/lib/notification-sound";
import {
  newKitchenOrders,
  waitingMinutes,
  type KitchenOrder,
} from "@/lib/kitchen";
import { formatDateTime } from "@/lib/utils";

const columns = [
  { status: "RECEBIDO", title: "Novos pedidos", color: "bg-blue-500" },
  { status: "ACEITO", title: "Na fila", color: "bg-amber-500" },
  { status: "PREPARANDO", title: "Em preparação", color: "bg-flame" },
];
export function KitchenBoard({
  initialOrders,
}: {
  initialOrders: KitchenOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [now, setNow] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const [connected, setConnected] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set(initialOrders.map((order) => order.id)));
  const soundEnabled = useRef(false);
  const inFlight = useRef(false);
  const version = useRef(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (inFlight.current) return;
    inFlight.current = true;
    const requestedVersion = version.current;
    const request = new AbortController();
    const abort = () => request.abort();
    const timeout = setTimeout(abort, 12000);
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await fetch("/api/admin/kitchen", {
        cache: "no-store",
        signal: request.signal,
      });
      if (!response.ok) throw Error("unavailable");
      const data: { orders: KitchenOrder[] } = await response.json();
      if (signal?.aborted || requestedVersion !== version.current) return;
      const incoming = newKitchenOrders(seen.current, data.orders);
      data.orders.forEach((order) => seen.current.add(order.id));
      if (incoming.length) {
        if (soundEnabled.current && !playNotificationSound()) {
          soundEnabled.current = false;
          setSound(false);
        }
        toast.info(
          incoming.length === 1
            ? `Novo pedido #${incoming[0].number}`
            : `${incoming.length} novos pedidos`,
          { duration: 6000 },
        );
      }
      setOrders(data.orders);
      setConnected(true);
    } catch {
      if (!signal?.aborted) setConnected(false);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      inFlight.current = false;
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const tick = () => {
      setNow(Date.now());
      void refresh(controller.signal);
    };
    const timer = setInterval(tick, 5000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", tick);
    return () => {
      controller.abort();
      clearInterval(timer);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", tick);
    };
  }, [refresh]);
  async function toggleSound() {
    if (soundEnabled.current) {
      soundEnabled.current = false;
      setSound(false);
      return;
    }
    const enabled = await enableNotificationSound();
    soundEnabled.current = enabled;
    setSound(enabled);
    if (enabled) playNotificationSound();
    else
      toast.error(
        "O navegador não liberou o som. Verifique as permissões de áudio.",
      );
  }
  async function changeStatus(order: KitchenOrder) {
    setBusy(order.id);
    version.current++;
    try {
      const next = order.status === "RECEBIDO" ? "ACEITO" : "PREPARANDO";
      const result = await updateOrderStatusAction(order.id, next);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: next } : item,
        ),
      );
      toast.success(next === "ACEITO" ? "Pedido aceito" : "Preparo iniciado");
    } catch {
      toast.error("Não foi possível atualizar o pedido.");
    } finally {
      version.current++;
      setBusy(null);
      void refresh();
    }
  }
  return (
    <div
      ref={root}
      className="min-h-[80vh] bg-paper-dim p-1 fullscreen:overflow-auto fullscreen:p-6"
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-flame" />
            <h1 className="font-display text-3xl">Cozinha</h1>
          </div>
          <p className="text-sm text-ash">
            {orders.length} pedidos na cozinha · mais antigos primeiro
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleSound}
            aria-pressed={sound}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white"
          >
            {sound ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            {sound ? "Som ativado" : "Ativar som"}
          </button>
          <button
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await root.current?.requestFullscreen();
              } catch {
                toast.info("Tela cheia indisponível neste navegador.");
              }
            }}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 px-4 text-sm font-semibold"
          >
            <Maximize className="h-4 w-4" />
            Tela cheia
          </button>
          <Link
            href="/admin/pedidos"
            className="flex min-h-11 items-center rounded-xl border border-ink/15 px-4 text-sm font-semibold"
          >
            Gerenciar pedidos
          </Link>
        </div>
      </header>
      <p
        role="status"
        className={`mb-5 text-sm ${connected ? "text-ash" : "rounded-xl bg-red-50 p-3 font-semibold text-red-800"}`}
      >
        {connected
          ? "Atualização automática a cada 5 segundos. Mantenha esta tela aberta e ative o som para ouvir novos pedidos."
          : "Sem atualização. Verifique a conexão; os pedidos abaixo podem estar desatualizados. Tentando reconectar…"}
      </p>
      <div className="grid gap-5 xl:grid-cols-3">
        {columns.map((column) => (
          <section
            key={column.status}
            className="min-w-0 rounded-2xl bg-ink/5 p-3"
          >
            <h2
              style={{ fontFamily: "var(--font-body)", textTransform: "none" }}
              className="mb-4 flex items-center gap-2 font-sans text-base font-bold normal-case"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
              {column.title}
              <span className="ml-auto rounded-full bg-white px-2 py-1 text-xs">
                {
                  orders.filter((order) => order.status === column.status)
                    .length
                }
              </span>
            </h2>
            <div className="space-y-3">
              {orders
                .filter((order) => order.status === column.status)
                .map((order) => {
                  const minutes =
                    now === null
                      ? null
                      : waitingMinutes(
                          order.scheduledFor ?? order.createdAt,
                          now,
                        );
                  const pendingPix =
                    order.paymentMethod === "PIX" &&
                    order.paymentStatus !== "PAGO";
                  return (
                    <article
                      key={order.id}
                      className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
                      data-order-number={order.number}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          style={{ fontFamily: "var(--font-body)" }}
                          className="font-sans text-xl font-extrabold normal-case"
                        >
                          #{order.number}
                        </h3>
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${minutes !== null && minutes >= 30 ? "bg-red-50 text-red-800" : "bg-ink/5 text-ash"}`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {minutes === null
                            ? "Calculando…"
                            : `${minutes} min de espera`}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ash">
                        {order.user.name} ·{" "}
                        {order.deliveryType === "RETIRADA"
                          ? "Retirada"
                          : "Entrega"}
                      </p>
                      {order.scheduledFor && (
                        <p className="mt-2 rounded-lg bg-blue-50 p-2 text-sm font-semibold text-blue-900">
                          Agendado: {formatDateTime(order.scheduledFor)}
                        </p>
                      )}
                      <ul className="my-3 divide-y divide-ink/10">
                        {order.items.map((item) => (
                          <li key={item.id} className="py-3">
                            <p className="text-base font-bold">
                              {item.quantity}× {item.productName}
                            </p>
                            {item.addonsLabel && (
                              <p className="mt-1 text-sm text-ash">
                                + {item.addonsLabel}
                              </p>
                            )}
                            {item.removedLabel && (
                              <p className="mt-1 rounded-lg bg-red-50 p-2 text-sm font-bold text-red-800">
                                SEM: {item.removedLabel}
                              </p>
                            )}
                            {item.notes && (
                              <p className="mt-1 text-sm font-semibold text-amber-900">
                                Observação: {item.notes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      {order.notes && (
                        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                          Pedido: {order.notes}
                        </p>
                      )}
                      {pendingPix && (
                        <p className="mb-3 text-sm font-semibold text-amber-900">
                          Aguardando confirmação do Pix
                        </p>
                      )}
                      {order.status !== "PREPARANDO" ? (
                        <button
                          disabled={!!busy || !connected || pendingPix}
                          onClick={() => changeStatus(order)}
                          className="min-h-12 w-full rounded-xl bg-ink px-3 py-3 text-sm font-bold text-white disabled:opacity-40"
                        >
                          {busy === order.id
                            ? "Atualizando…"
                            : order.status === "RECEBIDO"
                              ? "Aceitar pedido"
                              : "Iniciar preparo"}
                        </button>
                      ) : (
                        <Link
                          href="/admin/pedidos"
                          className="flex min-h-12 items-center justify-center rounded-xl bg-flame px-3 text-center text-sm font-bold text-white"
                        >
                          Gerenciar saída / retirada
                        </Link>
                      )}
                    </article>
                  );
                })}
              {!orders.some((order) => order.status === column.status) && (
                <p className="py-10 text-center text-sm text-ash">
                  Nenhum pedido aqui
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
