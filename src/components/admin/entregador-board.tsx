"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Navigation,
  Package,
  ArrowUp,
  ArrowDown,
  Route,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/utils";
import { paymentDescription } from "@/lib/payment-options";
import { entregadorUpdateStatusAction } from "@/actions/orders";
import {
  deliveryAddress,
  mapsRoute,
  mapsRouteSections,
  type DriverOrder,
} from "@/lib/driver";

export function EntregadorBoard({
  initialOrders,
  storeAddress,
}: {
  initialOrders: DriverOrder[];
  storeAddress: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [selected, setSelected] = useState<string[]>([]);
  const [planned, setPlanned] = useState<{
    ids: string[];
    origin?: string;
    optimized: boolean;
    key: string;
  } | null>(null);
  const [fromCurrent, setFromCurrent] = useState(false);
  const [routeBusy, setRouteBusy] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [confirmation, setConfirmation] = useState<DriverOrder | null>(null);
  const version = useRef(0),
    inFlight = useRef(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (inFlight.current) return;
      inFlight.current = true;
      const requested = version.current;
      try {
        const response = await fetch("/api/entregador/pedidos", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(12000),
          ]),
        });
        if (!response.ok) throw Error("Falha ao atualizar");
        const data = await response.json();
        if (!controller.signal.aborted && requested === version.current) {
          setOrders(data.orders);
          setConnected(true);
        }
      } catch {
        if (!controller.signal.aborted) setConnected(false);
      } finally {
        inFlight.current = false;
      }
    }
    refreshRef.current = refresh;
    const timer = setInterval(() => void refresh(), 10000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, []);
  const eligible = orders.filter((o) => o.address);
  const ids = selected.filter((id) => eligible.some((o) => o.id === id));
  const key = JSON.stringify(
    ids.map((id) => {
      const o = orders.find((o) => o.id === id)!;
      return [id, o.address];
    }),
  );
  const currentPlan = planned?.key === key ? planned : null;
  const stops = (currentPlan?.ids ?? ids)
    .map((id) => orders.find((o) => o.id === id)!)
    .filter(Boolean);
  let sections: ReturnType<typeof mapsRouteSections> = [];
  try {
    sections = mapsRouteSections(
      stops.map((o) => ({ id: o.id, address: deliveryAddress(o.address!) })),
      currentPlan?.origin ?? (!fromCurrent ? storeAddress : undefined),
    );
  } catch {
    /* Individual address links remain available. */
  }
  function toggle(id: string) {
    setPlanned(null);
    setSelected((prev) => {
      const active = prev.filter((value) =>
        eligible.some((order) => order.id === value),
      );
      return active.includes(id)
        ? active.filter((value) => value !== id)
        : active.length < 10
          ? [...active, id]
          : active;
    });
  }
  function move(index: number, direction: number) {
    const next = stops.map((o) => o.id);
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setSelected(next);
    setPlanned(
      currentPlan
        ? {
            ...currentPlan,
            ids: next,
            optimized: false,
            key: JSON.stringify(
              next.map((id) => [id, orders.find((o) => o.id === id)!.address]),
            ),
          }
        : null,
    );
  }
  async function optimize() {
    setRouteBusy(true);
    try {
      let origin;
      if (fromCurrent) {
        if (!navigator.geolocation)
          throw Error("Localização indisponível. Escolha sair da loja.");
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }),
        );
        origin = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
      const response = await fetch("/api/entregador/rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, origin }),
        signal: AbortSignal.timeout(55000),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.message);
      setPlanned({ ids: data.ids, origin: data.origin, optimized: true, key });
      toast.success("Sequência de paradas calculada.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular. Organize as paradas manualmente.",
      );
    } finally {
      setRouteBusy(false);
    }
  }
  async function update(
    order: DriverOrder,
    status: "SAIU_PARA_ENTREGA" | "ENTREGUE",
  ) {
    setBusy(order.id);
    version.current++;
    try {
      const result = await entregadorUpdateStatusAction(order.id, status);
      if (!result.success) throw Error(result.message);
      setOrders((prev) =>
        status === "ENTREGUE"
          ? prev.filter((o) => o.id !== order.id)
          : prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
      );
      setSelected((prev) => prev.filter((id) => id !== order.id));
      setPlanned(null);
      setConfirmation(null);
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar.",
      );
    } finally {
      version.current++;
      setBusy(null);
      void refreshRef.current();
    }
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ash">Sua jornada de entregas</p>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-body)", textTransform: "none" }}
          >
            Minhas entregas
          </h1>
          <p className="mt-1 text-sm text-ash">
            {orders.length} pedidos atribuídos a você
          </p>
        </div>
        <button
          onClick={() => void refreshRef.current()}
          className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </header>
      {!connected && (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
        >
          Sem atualização. Confira a conexão antes de sair para entrega.
        </p>
      )}
      {!!orders.length && (
        <section
          className="rounded-2xl bg-ink p-5 text-white sm:p-6"
          aria-label="Planejar entregas"
        >
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-flame" />
            <h2
              style={{ fontFamily: "var(--font-body)", textTransform: "none" }}
              className="text-lg font-bold"
            >
              Organizar minha rota
            </h2>
          </div>
          <p className="mt-2 text-sm text-white/70">
            Selecione até 10 pedidos abaixo. Calcule uma sequência ou ajuste a
            ordem pelas setas.
          </p>
          <label className="mt-4 block text-sm font-semibold">
            Ponto de partida
            <select
              disabled={routeBusy}
              value={fromCurrent ? "current" : "store"}
              onChange={(e) => {
                setFromCurrent(e.target.value === "current");
                setPlanned(null);
              }}
              className="mt-2 block min-h-11 w-full rounded-xl bg-white px-3 text-ink"
            >
              <option value="store">Sair da loja</option>
              <option value="current">Minha localização atual</option>
            </select>
          </label>
          <button
            disabled={!ids.length || routeBusy || !connected}
            onClick={optimize}
            className="mt-4 min-h-11 rounded-xl bg-flame px-5 font-bold disabled:opacity-50"
          >
            {routeBusy ? "Calculando rota…" : "Sugerir melhor sequência"}
          </button>
          {!!stops.length && (
            <>
              <ol className="mt-5 space-y-2">
                {stops.map((o, i) => (
                  <li
                    key={o.id}
                    className="flex items-center gap-2 rounded-xl bg-white/10 p-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold text-ink">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">Pedido #{o.number}</p>
                      <p className="break-words text-xs text-white/70">
                        {deliveryAddress(o.address!)}
                      </p>
                    </div>
                    <button
                      disabled={i === 0 || routeBusy}
                      aria-label={`Mover pedido ${o.number} para cima`}
                      onClick={() => move(i, -1)}
                      className="flex h-11 w-9 shrink-0 items-center justify-center disabled:opacity-25"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      disabled={i === stops.length - 1 || routeBusy}
                      aria-label={`Mover pedido ${o.number} para baixo`}
                      onClick={() => move(i, 1)}
                      className="flex h-11 w-9 shrink-0 items-center justify-center disabled:opacity-25"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-white/70">
                {currentPlan?.optimized
                  ? "Sequência sugerida pelo tempo estimado nas vias, sem trânsito em tempo real."
                  : "Sequência organizada por você."}{" "}
                O Maps atualiza o trajeto ao abrir. Confira os endereços antes
                de sair.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {sections.map((section, i) => (
                  <a
                    key={section.url}
                    href={section.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-center text-sm font-bold text-ink"
                  >
                    <Navigation className="h-4 w-4 shrink-0" />
                    {sections.length === 1
                      ? "Abrir rota com paradas no Maps"
                      : `Abrir trecho ${i + 1} de ${sections.length} no Maps`}
                  </a>
                ))}
              </div>
              {!sections.length && <p role="alert" className="mt-3 text-sm text-white/80">Um endereço é muito longo para montar a rota. Use os links individuais dos pedidos.</p>}
              {sections.length > 1 && (
                <p className="mt-3 text-xs text-white/70">
                  Siga os trechos na ordem. Cada trecho inclui até quatro
                  entregas para funcionar também no navegador do celular.
                </p>
              )}
            </>
          )}
        </section>
      )}
      {!orders.length && (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-ash" />
          <p className="font-semibold">Nenhuma entrega atribuída no momento</p>
          <p className="mt-2 text-sm text-ash">
            Os novos pedidos aparecerão aqui automaticamente.
          </p>
        </div>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {orders.map((order) => (
          <article
            data-order-number={order.number}
            key={order.id}
            className="space-y-4 rounded-2xl border-2 border-ink/5 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-body)",
                  textTransform: "none",
                }}
              >
                Pedido #{order.number}
              </h2>
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold">
                {order.status === "PREPARANDO" ? "Em preparação" : "Em entrega"}
              </span>
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-xl bg-paper-dim p-3 text-sm font-semibold">
              <input
                type="checkbox"
                aria-label={`Incluir pedido ${order.number} na rota`}
                checked={ids.includes(order.id)}
                disabled={
                  !order.address ||
                  routeBusy ||
                  (!ids.includes(order.id) && ids.length >= 10)
                }
                onChange={() => toggle(order.id)}
                className="h-5 w-5 accent-red-600"
              />
              Incluir na minha rota
            </label>
            <div className="space-y-2 text-sm">
              <p className="font-bold">{order.user.name}</p>
              {order.user.phone && (
                <a
                  className="flex items-center gap-2 font-semibold text-flame"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/${order.user.phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`}
                >
                  <Phone className="h-4 w-4" />
                  {order.user.phone}
                </a>
              )}
              {order.address ? (
                <>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {deliveryAddress(order.address)}
                  </p>
                  {order.address.complement && (
                    <p>
                      <strong>Complemento:</strong> {order.address.complement}
                    </p>
                  )}
                  {order.address.reference && (
                    <p>
                      <strong>Referência:</strong> {order.address.reference}
                    </p>
                  )}
                </>
              ) : (
                <p role="alert" className="text-red-700">
                  Endereço indisponível. Consulte a loja antes de sair.
                </p>
              )}
            </div>
            <div className="space-y-3 border-t border-ink/10 pt-3">
              {order.items.map((item) => (
                <div key={item.id} className="text-sm">
                  <p className="font-bold">
                    {item.quantity}× {item.productName}
                  </p>
                  {item.removedLabel && (
                    <p className="text-red-700">Sem: {item.removedLabel}</p>
                  )}
                  {item.addonsLabel && <p>Adicionais: {item.addonsLabel}</p>}
                  {item.notes && (
                    <p className="text-ash">Observação: {item.notes}</p>
                  )}
                </div>
              ))}
            </div>
            {order.notes && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm">
                <strong>Observação do pedido:</strong> {order.notes}
              </p>
            )}
            <div className="rounded-xl bg-paper-dim p-3 text-sm">
              <p className="font-bold">
                {order.paymentStatus === "PAGO"
                  ? "Já pago"
                  : "Receber na entrega"}{" "}
                · {formatMoney(order.total)}
              </p>
              <p>{paymentDescription(order)}</p>
              {order.changeFor != null &&
                order.paymentMethod === "DINHEIRO" && (
                  <p>
                    Troco para {formatMoney(order.changeFor)} · levar{" "}
                    {formatMoney(Math.max(0, order.changeFor - order.total))} de
                    troco
                  </p>
                )}
            </div>
            {order.address && (
              <a
                href={mapsRoute([deliveryAddress(order.address)])}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-bold"
              >
                <Navigation className="h-4 w-4" />
                Ir para este endereço no Maps
              </a>
            )}
            <Button
              disabled={!!busy || !connected}
              className="min-h-12 w-full"
              onClick={() =>
                order.status === "SAIU_PARA_ENTREGA"
                  ? setConfirmation(order)
                  : void update(order, "SAIU_PARA_ENTREGA")
              }
            >
              {busy === order.id
                ? "Salvando…"
                : order.status === "PREPARANDO"
                  ? "Sair para entrega"
                  : "Confirmar entrega"}
            </Button>
          </article>
        ))}
      </div>
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(null);
        }}
      >
        <DialogContent className="max-w-sm">
          {confirmation && (
            <>
              <DialogTitle
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-body)",
                  textTransform: "none",
                }}
              >
                Entregar pedido #{confirmation.number}?
              </DialogTitle>
              <DialogDescription className="text-sm">
                Confirme somente após entregar ao cliente.
                {confirmation.paymentStatus !== "PAGO" &&
                confirmation.paymentMethod !== "PIX"
                  ? " Confira também o recebimento do pagamento."
                  : ""}
              </DialogDescription>
              <Button
                disabled={!!busy}
                className="w-full"
                onClick={() => void update(confirmation, "ENTREGUE")}
              >
                Sim, pedido entregue
              </Button>
              <button
                disabled={!!busy}
                onClick={() => setConfirmation(null)}
                className="min-h-11 w-full text-sm font-semibold"
              >
                Voltar
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
