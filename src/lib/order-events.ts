import { EventEmitter } from "events";

// Emissor de eventos em memória, compartilhado pelo processo Node do servidor.
// Alimenta o stream SSE (/api/admin/orders/events) que o painel administrativo
// escuta para tocar som e exibir notificação assim que um pedido chega ou muda
// de status — sem necessidade de recarregar a página.
//
// Para múltiplas instâncias em produção, substitua por um pub/sub compartilhado
// (Redis, Ably, Pusher). Em uma única instância (VPS/Docker), isso já é
// tempo real de verdade.

const globalForEvents = globalThis as unknown as { orderEvents?: EventEmitter };

export const orderEvents = globalForEvents.orderEvents ?? new EventEmitter();
orderEvents.setMaxListeners(50);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.orderEvents = orderEvents;
}

export type OrderEventPayload = {
  type: "new-order" | "status-update";
  restaurantId: string;
  orderId: string;
  orderNumber?: number;
  status?: string;
};

export function emitOrderEvent(payload: OrderEventPayload) {
  orderEvents.emit("order-event", payload);
}
