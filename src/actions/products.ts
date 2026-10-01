"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { productSchema, categorySchema, addonSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

type ActionResult = { success: boolean; message: string; id?: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado.");
  }
  if (!session.user.restaurantId) throw new Error("Empresa não identificada.");
  return session.user.restaurantId;
}

export async function upsertProductAction(
  productId: string | null,
  input: unknown
): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;
  const category = await prisma.category.findFirst({ where: { id: data.categoryId, restaurantId }, select: { id: true } });
  if (!category) return { success: false, message: "Categoria não encontrada nesta loja." };
  const addonIds = [...new Set(data.addonIds ?? [])];
  if (addonIds.length) {
    const addons = await prisma.addon.count({ where: { id: { in: addonIds }, restaurantId } });
    if (addons !== addonIds.length) return { success: false, message: "Adicional não encontrado nesta loja." };
  }
  const slug = slugify(data.name);

  const payload = {
    name: data.name,
    slug,
    description: data.description,
    ingredients: data.ingredients,
    image: data.image,
    price: data.price,
    promoPrice: data.promoPrice || null,
    categoryId: data.categoryId,
    available: data.available ?? true,
    featured: data.featured ?? false,
  };

  const product = await prisma.$transaction(async (tx) => {
  let product;
  if (productId) {
    product = await tx.product.update({ where: { id: productId, restaurantId }, data: payload });
    await tx.productAddon.deleteMany({ where: { productId } });
  } else {
    product = await tx.product.create({ data: { ...payload, restaurantId } });
  }

  if (addonIds.length) {
    await tx.productAddon.createMany({
      data: addonIds.map((addonId) => ({ productId: product.id, addonId })),
    });
  }
  return product;
  });

  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  revalidatePath("/");
  return { success: true, message: "Produto salvo com sucesso.", id: product.id };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  await prisma.product.deleteMany({ where: { id: productId, restaurantId } });
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  return { success: true, message: "Produto removido." };
}

export async function toggleProductAvailabilityAction(
  productId: string,
  available: boolean
): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  await prisma.product.updateMany({ where: { id: productId, restaurantId }, data: { available } });
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  return { success: true, message: "Disponibilidade atualizada." };
}

export async function upsertCategoryAction(
  categoryId: string | null,
  input: unknown
): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const slug = slugify(parsed.data.name);
  if (categoryId) {
    const result = await prisma.category.updateMany({
      where: { id: categoryId, restaurantId },
      data: { ...parsed.data, slug },
    });
    if (!result.count) return { success: false, message: "Categoria não encontrada." };
  } else {
    await prisma.category.create({ data: { ...parsed.data, slug, restaurantId } });
  }
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  return { success: true, message: "Categoria salva." };
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  const inUse = await prisma.product.count({ where: { categoryId, restaurantId } });
  if (inUse > 0) {
    return { success: false, message: "Não é possível excluir: existem produtos nesta categoria." };
  }
  await prisma.category.deleteMany({ where: { id: categoryId, restaurantId } });
  revalidatePath("/admin/cardapio");
  return { success: true, message: "Categoria removida." };
}

export async function upsertAddonAction(
  addonId: string | null,
  input: unknown
): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  const parsed = addonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (addonId) {
    const result = await prisma.addon.updateMany({ where: { id: addonId, restaurantId }, data: parsed.data });
    if (!result.count) return { success: false, message: "Adicional não encontrado." };
  } else {
    await prisma.addon.create({ data: { ...parsed.data, restaurantId } });
  }
  revalidatePath("/admin/cardapio");
  return { success: true, message: "Adicional salvo." };
}

export async function deleteAddonAction(addonId: string): Promise<ActionResult> {
  const restaurantId = await requireAdmin();
  await prisma.addon.deleteMany({ where: { id: addonId, restaurantId } });
  revalidatePath("/admin/cardapio");
  return { success: true, message: "Adicional removido." };
}
