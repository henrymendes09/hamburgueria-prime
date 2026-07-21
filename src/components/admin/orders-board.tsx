"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, MapPin, Clock, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, formatDateTime, PAYMENT_LABEL } from "@/lib/utils";
import { updateOrderStatusAction, assignEntregadorAction } from "@/actions/orders";
import { playNotificationSound } from "@/lib/notification-sound";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  addonsLabel: string | null;
  removedLabel: string | null;
  notes: string | null;
};

type BoardOrder = {
  id: string;
  number: number;
  status: string;
  paymentMethod: string;
  total: number;
  notes: string | null;
  createdAt: string;
  deliveryType: string;
  user: { name: string; phone: string | null };
  address: { street: string; number: string; neighborhood: string; city: string } | null;
  entregador: { id: string; name: string } | null;
  items: OrderItem[];
};

const STATUS_COLUMNS = [
  { status: "RECEBIDO", title: "Novo Pedido", color: "border-blue-400" },
  { status: "ACEITO", title: "Aceito", color: "border-amber-400" },
  { status: "PREPARANDO", title: "Preparando", color: "border-orange-400" },
  { status: "SAIU_PARA_ENTREGA", title: "Saiu para entrega", color: "border-purple-400" },
];

const NEXT_ACTIONS: Record<string, { label: string; next: string; variant?: "default" | "outline" | "dark" }[]> = {
  RECEBIDO: [
    { label: "Aceitar", next: "ACEITO" },
    { label: "Recusar", next: "RECUSADO", variant: "outline" },
  ],
  ACEITO: [
    { label: "Preparar", next: "PREPARANDO" },
    { label: "Cancelar", next: "CANCELADO", variant: "outline" },
  ],
  PREPARANDO: [
    { label: "Saiu para entrega", next: "SAIU_PARA_ENTREGA" },
    { label: "Cancelar", next: "CANCELADO", variant: "outline" },
  ],
  SAIU_PARA_ENTREGA: [{ label: "Marcar como entregue", next: "ENTREGUE" }],
};

export function OrdersBoard({
  initialOrders,
  entregadores,
}: {
  initialOrders: BoardOrder[];
  entregadores: { id: string; name: string }[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com dados atualizados vindos do server component após router.refresh()
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const source = new EventSource("/api/admin/orders/events");

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "new-order") {
        playNotificationSound();
        toast.success(`Novo pedido recebido! #${payload.orderNumber}`, { duration: 6000 });
        refresh();
      } else if (payload.type === "status-update") {
        refresh();
      }
    };

    source.onerror = () => {
      // O EventSource tenta reconectar automaticamente
    };

    return () => source.close();
  }, [refresh]);

  async function handleStatusChange(orderId: string, next: string) {
    const result = await updateOrderStatusAction(orderId, next);
    if (result.success) {
      toast.success(result.message);
      setOrders((prev) =>
        next === "ENTREGUE" || next === "CANCELADO" || next === "RECUSADO"
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) => (o.id === orderId ? { ...o, status: next } : o))
      );
    } else {
      toast.error(result.message);
    }
  }

  async function handleAssignEntregador(orderId: string, entregadorId: string) {
    const result = await assignEntregadorAction(orderId, entregadorId);
    if (result.success) {
      toast.success(result.message);
      refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Gestão de Pedidos</h1>
        <p className="text-ash normal-case mt-1">Atualizações em tempo real — novos pedidos tocam um alerta sonoro.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {STATUS_COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="space-y-3">
              <div className={`flex items-center justify-between border-b-2 ${col.color} pb-2`}>
                <h2 className="font-display text-sm text-ink">{col.title}</h2>
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-bold">{columnOrders.length}</span>
              </div>

              {columnOrders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-white border-2 border-ink/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base text-ink">#{order.number}</span>
                    <span className="text-xs text-ash-light flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDateTime(order.createdAt).split(" ")[1]}
                    </span>
                  </div>

                  <div className="text-xs text-ash normal-case space-y-1">
                    <p className="font-semibold text-ink">{order.user.name}</p>
                    {order.user.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {order.user.phone}
                      </p>
                    )}
                    {order.address && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {order.address.street}, {order.address.number} — {order.address.neighborhood}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-ink/5 pt-2 space-y-1">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-xs text-ink normal-case">
                        {item.quantity}x {item.productName}
                        {item.addonsLabel && <span className="text-ash-light"> (+{item.addonsLabel})</span>}
                      </p>
                    ))}
                    {order.notes && <p className="text-xs italic text-ash-light">&ldquo;{order.notes}&rdquo;</p>}
                  </div>

                  <div className="flex items-center justify-between border-t border-ink/5 pt-2">
                    <span className="text-xs font-semibold text-ash">{PAYMENT_LABEL[order.paymentMethod]}</span>
                    <span className="font-display text-base text-flame">{formatMoney(order.total)}</span>
                  </div>

                  {col.status === "PREPARANDO" && entregadores.length > 0 && (
                    <Select
                      value={order.entregador?.id}
                      onValueChange={(v) => handleAssignEntregador(order.id, v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <Bike className="h-3.5 w-3.5 mr-1" />
                        <SelectValue placeholder="Atribuir entregador" />
                      </SelectTrigger>
                      <SelectContent>
                        {entregadores.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex gap-2">
                    {NEXT_ACTIONS[order.status]?.map((action) => (
                      <Button
                        key={action.next}
                        size="sm"
                        variant={action.variant ?? "default"}
                        className="flex-1 text-xs"
                        onClick={() => handleStatusChange(order.id, action.next)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              {columnOrders.length === 0 && (
                <p className="text-xs text-ash-light text-center py-6">Nenhum pedido</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
