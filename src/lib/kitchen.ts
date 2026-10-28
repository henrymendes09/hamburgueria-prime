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
export function newKitchenOrders(
  previous: Set<string>,
  orders: KitchenOrder[],
) {
  return orders.filter((order) => !previous.has(order.id));
}
