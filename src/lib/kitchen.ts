export type KitchenOrder = {
  id: string;
  number: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryType: string;
  createdAt: string;
  scheduledFor: string | null;
  notes: string | null;
  user: { name: string };
  items: {
    id: string;
    productName: string;
    quantity: number;
    addonsLabel: string | null;
    removedLabel: string | null;
    notes: string | null;
  }[];
};
export function waitingMinutes(createdAt: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
}
export function kitchenActions(
  order: Pick<KitchenOrder, "status" | "deliveryType">,
) {
  const cancel = { next: "CANCELADO", label: "Cancelar pedido", confirm: true };
  switch (order.status) {
    case "RECEBIDO":
      return [
        { next: "ACEITO", label: "Aceitar pedido", confirm: false },
        { next: "RECUSADO", label: "Recusar pedido", confirm: true },
      ];
    case "ACEITO":
      return [
        { next: "PREPARANDO", label: "Iniciar preparo", confirm: false },
        cancel,
      ];
    case "PREPARANDO":
      return [
        order.deliveryType === "RETIRADA"
          ? { next: "ENTREGUE", label: "Confirmar retirada", confirm: true }
          : {
              next: "SAIU_PARA_ENTREGA",
              label: "Saiu para entrega",
              confirm: false,
            },
        cancel,
      ];
    case "SAIU_PARA_ENTREGA":
      return [
        {
          next: "ENTREGUE",
          label:
            order.deliveryType === "RETIRADA"
              ? "Confirmar retirada"
              : "Confirmar entrega",
          confirm: true,
        },
      ];
    default:
      return [];
  }
}
export function newKitchenOrders(
  previous: Set<string>,
  orders: KitchenOrder[],
) {
  return orders.filter((order) => !previous.has(order.id));
}
