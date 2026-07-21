"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Navigation, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, PAYMENT_LABEL } from "@/lib/utils";
import { entregadorUpdateStatusAction } from "@/actions/orders";

type Order = {
  id: string;
  number: number;
  status: string;
  total: number;
  paymentMethod: string;
  user: { name: string; phone: string | null };
  address: { street: string; number: string; neighborhood: string; city: string } | null;
  items: { id: string; productName: string; quantity: number }[];
};

export function EntregadorBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);

  async function handleUpdate(orderId: string, status: "SAIU_PARA_ENTREGA" | "ENTREGUE") {
    const result = await entregadorUpdateStatusAction(orderId, status);
    if (result.success) {
      toast.success(result.message);
      setOrders((prev) =>
        status === "ENTREGUE"
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } else {
      toast.error(result.message);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center border-2 border-ink/5">
        <Package className="h-10 w-10 text-ash-light mx-auto mb-3" />
        <p className="text-ash font-semibold">Nenhuma entrega atribuída no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {orders.map((order) => {
        const address = order.address
          ? `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city}`
          : "";
        return (
          <div key={order.id} className="rounded-2xl bg-white border-2 border-ink/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-ink">Pedido #{order.number}</span>
              <span className="font-display text-lg text-flame">{formatMoney(order.total)}</span>
            </div>

            <div className="text-sm text-ash normal-case space-y-1">
              <p className="font-semibold text-ink">{order.user.name}</p>
              {order.user.phone && (
                <a href={`https://wa.me/55${order.user.phone.replace(/\D/g, "")}`} className="flex items-center gap-1.5 text-flame font-semibold">
                  <Phone className="h-3.5 w-3.5" /> {order.user.phone}
                </a>
              )}
              {address && (
                <p className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {address}
                </p>
              )}
            </div>

            <div className="border-t border-ink/5 pt-2 space-y-1">
              {order.items.map((item) => (
                <p key={item.id} className="text-xs text-ink normal-case">
                  {item.quantity}x {item.productName}
                </p>
              ))}
              <p className="text-xs text-ash-light font-semibold">{PAYMENT_LABEL[order.paymentMethod]}</p>
            </div>

            {address && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink/10 py-2.5 text-sm font-bold text-ink"
              >
                <Navigation className="h-4 w-4" /> Abrir rota no mapa
              </a>
            )}

            {order.status === "PREPARANDO" && (
              <Button className="w-full" onClick={() => handleUpdate(order.id, "SAIU_PARA_ENTREGA")}>
                Aceitar entrega
              </Button>
            )}
            {order.status === "SAIU_PARA_ENTREGA" && (
              <Button className="w-full" onClick={() => handleUpdate(order.id, "ENTREGUE")}>
                Finalizar entrega
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
