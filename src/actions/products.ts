"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { productSchema, categorySchema, addonSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

type ActionResult = { success: boolean; message: string; id?: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado.");
  }
}

export async function upsertProductAction(
  productId: string | null,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;
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

  let product;
  if (productId) {
    product = await prisma.product.update({ where: { id: productId }, data: payload });
    await prisma.productAddon.deleteMany({ where: { productId } });
  } else {
    product = await prisma.product.create({ data: payload });
  }

  if (data.addonIds?.length) {
    await prisma.productAddon.createMany({
      data: data.addonIds.map((addonId) => ({ productId: product.id, addonId })),
    });
  }

  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  revalidatePath("/");
  return { success: true, message: "Produto salvo com sucesso.", id: product.id };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  return { success: true, message: "Produto removido." };
}

export async function toggleProductAvailabilityAction(
  productId: string,
  available: boolean
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { available } });
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  return { success: true, message: "Disponibilidade atualizada." };
}

export async function upsertCategoryAction(
  categoryId: string | null,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const slug = slugify(parsed.data.name);
  if (categoryId) {
    await prisma.category.update({
      where: { id: categoryId },
      data: { ...parsed.data, slug },
    });
  } else {
    await prisma.category.create({ data: { ...parsed.data, slug } });
  }
  revalidatePath("/admin/cardapio");
  revalidatePath("/cardapio");
  return { success: true, message: "Categoria salva." };
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  await requireAdmin();
  const inUse = await prisma.product.count({ where: { categoryId } });
  if (inUse > 0) {
    return { success: false, message: "Não é possível excluir: existem produtos nesta categoria." };
  }
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/admin/cardapio");
  return { success: true, message: "Categoria removida." };
}

export async function upsertAddonAction(
  addonId: string | null,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = addonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (addonId) {
    await prisma.addon.update({ where: { id: addonId }, data: parsed.data });
  } else {
    await prisma.addon.create({ data: parsed.data });
  }
  revalidatePath("/admin/cardapio");
  return { success: true, message: "Adicional salvo." };
}

export async function deleteAddonAction(addonId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.addon.delete({ where: { id: addonId } });
  revalidatePath("/admin/cardapio");
  return { success: true, message: "Adicional removido." };
}
