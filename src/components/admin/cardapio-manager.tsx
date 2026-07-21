"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { AddonFormDialog } from "@/components/admin/addon-form-dialog";
import {
  deleteProductAction,
  toggleProductAvailabilityAction,
  deleteCategoryAction,
  deleteAddonAction,
} from "@/actions/products";

type Product = {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  image: string;
  price: number;
  promoPrice: number | null;
  available: boolean;
  featured: boolean;
  categoryId: string;
  categoryName: string;
  addonIds: string[];
};
type Category = { id: string; name: string; icon: string; order: number };
type Addon = { id: string; name: string; price: number; type: string };

export function CardapioManager({
  products,
  categories,
  addons,
}: {
  products: Product[];
  categories: Category[];
  addons: Addon[];
}) {
  const [productDialog, setProductDialog] = useState<{ open: boolean; product?: Product }>({ open: false });
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [addonDialog, setAddonDialog] = useState<{ open: boolean; addon?: Addon }>({ open: false });

  async function handleDeleteProduct(id: string) {
    if (!confirm("Remover este produto? Esta ação não pode ser desfeita.")) return;
    const result = await deleteProductAction(id);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  async function handleToggleAvailability(id: string, available: boolean) {
    const result = await toggleProductAvailabilityAction(id, available);
    if (!result.success) toast.error(result.message);
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Remover esta categoria?")) return;
    const result = await deleteCategoryAction(id);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  async function handleDeleteAddon(id: string) {
    if (!confirm("Remover este adicional?")) return;
    const result = await deleteAddonAction(id);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Gestão de Cardápio</h1>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList className="mb-6">
          <TabsTrigger value="produtos">Produtos ({products.length})</TabsTrigger>
          <TabsTrigger value="categorias">Categorias ({categories.length})</TabsTrigger>
          <TabsTrigger value="adicionais">Adicionais ({addons.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setProductDialog({ open: true })} className="gap-2">
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-2xl bg-white border-2 border-ink/5 overflow-hidden">
                <div className="relative aspect-video">
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="300px" />
                  {product.featured && <Badge className="absolute left-2 top-2">Destaque</Badge>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm text-ink normal-case">{product.name}</h3>
                    <span className="text-xs text-ash-light shrink-0">{product.categoryName}</span>
                  </div>
                  <p className="text-xs text-ash-light mb-2">
                    {product.promoPrice ? (
                      <>
                        <span className="line-through">{formatMoney(product.price)}</span>{" "}
                        <span className="text-flame font-bold">{formatMoney(product.promoPrice)}</span>
                      </>
                    ) : (
                      formatMoney(product.price)
                    )}
                  </p>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs">
                      <Switch
                        checked={product.available}
                        onCheckedChange={(v) => handleToggleAvailability(product.id, v)}
                      />
                      Disponível
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setProductDialog({ open: true, product })}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-flame/10 text-flame"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categorias">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setCategoryDialog({ open: true })} className="gap-2">
              <Plus className="h-4 w-4" /> Nova categoria
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-2xl bg-white border-2 border-ink/5 p-4">
                <span className="flex items-center gap-2 font-bold text-sm">
                  {cat.icon} {cat.name}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setCategoryDialog({ open: true, category: cat })} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-flame/10 text-flame">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="adicionais">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setAddonDialog({ open: true })} className="gap-2">
              <Plus className="h-4 w-4" /> Novo adicional
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between rounded-2xl bg-white border-2 border-ink/5 p-4">
                <div>
                  <p className="font-bold text-sm">{addon.name}</p>
                  <p className="text-xs text-ash-light">{addon.type} · {formatMoney(addon.price)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setAddonDialog({ open: true, addon })} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteAddon(addon.id)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-flame/10 text-flame">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ProductFormDialog
        open={productDialog.open}
        onOpenChange={(open) => setProductDialog({ open })}
        categories={categories}
        addons={addons}
        initialValues={productDialog.product}
      />
      <CategoryFormDialog
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog({ open })}
        initialValues={categoryDialog.category}
      />
      <AddonFormDialog
        open={addonDialog.open}
        onOpenChange={(open) => setAddonDialog({ open })}
        initialValues={addonDialog.addon}
      />
    </div>
  );
}
