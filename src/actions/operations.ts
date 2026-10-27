"use server";
import { requireRestaurantAdmin } from "@/lib/tenant";
import { operationSchema, describeHours } from "@/lib/store-hours";
import { audited } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function saveOperationSettings(input: unknown) {
  const { session, restaurantId } = await requireRestaurantAdmin();
  const parsed = operationSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os horários." };
  await audited(session, tx => tx.restaurant.update({ where: { id: restaurantId }, data: { operationSettings: parsed.data, businessHours: describeHours(parsed.data) } }));
  revalidatePath("/", "layout");
  return { success: true, message: "Funcionamento atualizado." };
}
