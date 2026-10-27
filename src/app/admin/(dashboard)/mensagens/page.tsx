import { requireRestaurantAdmin } from "@/lib/tenant";
import { MessagesManager } from "@/components/admin/messages-manager";

export const metadata = { title: "Mensagens dos clientes" };

export default async function AdminMensagensPage() {
  await requireRestaurantAdmin();
  return <MessagesManager />;
}
