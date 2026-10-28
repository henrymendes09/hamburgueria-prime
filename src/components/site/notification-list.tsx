"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readVisibleOrderNotifications } from "@/actions/notifications";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  orderId: string;
  restaurantSlug: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};
export function NotificationList({ items }: { items: Notification[] }) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const pendingKey = items
    .filter((item) => !item.read && !readIds.has(item.id))
    .map((item) => item.id)
    .join(",");
  useEffect(() => {
    if (!pendingKey) return;
    let active = true;
    const ids = pendingKey.split(",");
    const timer = setTimeout(async () => {
      try {
        const result = await readVisibleOrderNotifications(ids);
        if (!result.success) throw Error("read-failed");
        if (active) {
          setReadIds((current) => new Set([...current, ...ids]));
          setFailed(false);
        }
        window.dispatchEvent(
          new CustomEvent("hp-notifications-read", {
            detail: { readCount: result.readCount },
          }),
        );
      } catch {
        if (active) setFailed(true);
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pendingKey, retry]);
  return (
    <section className="space-y-4 normal-case">
      <h2
        style={{ fontFamily: "var(--font-body)", textTransform: "none" }}
        className="text-xl font-bold"
      >
        Notificações dos pedidos
      </h2>
      <p className="text-sm text-ash">
        Últimas 100 atualizações dos seus pedidos.
      </p>
      {failed && (
        <div
          role="alert"
          className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p>Não foi possível marcar as notificações como lidas.</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              setFailed(false);
              setRetry((current) => current + 1);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      {!items.length && <p>Nenhuma atualização de pedido por enquanto.</p>}
      {items.map((item) => (
        <article
          key={item.id}
          className={`rounded-xl border bg-white p-4 ${item.read || readIds.has(item.id) ? "border-ink/10" : "border-flame/30"}`}
        >
          <h3
            style={{ fontFamily: "var(--font-body)", textTransform: "none" }}
            className="text-base font-semibold leading-relaxed"
          >
            {item.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed">{item.message}</p>
          <p className="mt-2 text-xs text-ash">
            {new Date(item.createdAt).toLocaleString("pt-BR")}
          </p>
          <Link
            href={`/pedido/${item.orderId}?loja=${encodeURIComponent(item.restaurantSlug)}`}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-flame"
          >
            Acompanhar pedido
          </Link>
        </article>
      ))}
    </section>
  );
}
