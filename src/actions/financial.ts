"use server";
import { requireRestaurantAdmin } from "@/lib/tenant";
import { audited } from "@/lib/audit";
import { revalidatePath } from "next/cache";
export async function saveOrderFeeAction(orderId: string, value: number | null) {
  const { session, restaurantId } = await requireRestaurantAdmin();
  if (typeof orderId !== "string" || orderId.length > 100 || (value !== null && (!Number.isFinite(value) || value < 0 || value > 100000))) return { success: false, message: "Taxa inválida." };
  const result = await audited(session, async tx => {
    const order = await tx.order.findFirst({ where: { id: orderId, restaurantId }, select: { total: true } });
    if (!order || (value !== null && value > order.total)) return false;
    await tx.order.update({ where: { id: orderId, restaurantId }, data: { paymentFee: value === null ? null : Math.round(value * 100) / 100 } });
    return true;
  });
  revalidatePath("/admin/financeiro");
  return { success: result, message: result ? "Taxa de pagamento registrada." : "Pedido não encontrado ou taxa maior que o total." };
}
