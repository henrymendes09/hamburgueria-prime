"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { upsertProductAction } from "@/actions/products";

type Category = { id: string; name: string };
type Addon = { id: string; name: string; type: string };
type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  ingredients: string;
  image: string;
  price: number;
  promoPrice: number | null;
  categoryId: string;
  available: boolean;
  featured: boolean;
  addonIds: string[];
};

const EMPTY: ProductFormValues = {
  name: "",
  description: "",
  ingredients: "",
  image: "",
  price: 0,
  promoPrice: null,
  categoryId: "",
  available: true,
  featured: false,
  addonIds: [],
};

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  addons,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  addons: Addon[];
  initialValues?: ProductFormValues;
}) {
  const [form, setForm] = useState<ProductFormValues>(initialValues ?? EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleAddon(id: string) {
    setForm((p) => ({
      ...p,
      addonIds: p.addonIds.includes(id) ? p.addonIds.filter((a) => a !== id) : [...p.addonIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image) {
      toast.error("Envie uma imagem para o produto.");
      return;
    }
    setIsSubmitting(true);
    const result = await upsertProductAction(initialValues?.id ?? null, form);
    setIsSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      setForm(EMPTY);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <ImageUploader value={form.image} onChange={(url) => setForm((p) => ({ ...p, image: url }))} />

          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              required
            />
          </div>

          <div>
            <Label>Ingredientes (separados por vírgula)</Label>
            <Input
              value={form.ingredients}
              onChange={(e) => setForm((p) => ({ ...p, ingredients: e.target.value }))}
              placeholder="pão brioche, carne 150g, queijo cheddar, alface, tomate"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label>Preço promocional</Label>
              <Input
                type="number"
                step="0.01"
                value={form.promoPrice ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, promoPrice: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {addons.length > 0 && (
            <div>
              <Label>Adicionais disponíveis para este produto</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {addons.map((addon) => (
                  <label key={addon.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.addonIds.includes(addon.id)}
                      onCheckedChange={() => toggleAddon(addon.id)}
                    />
                    {addon.name} <span className="text-xs text-ash-light">({addon.type})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.available}
                onCheckedChange={(v) => setForm((p) => ({ ...p, available: !!v }))}
              />
              Disponível
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.featured}
                onCheckedChange={(v) => setForm((p) => ({ ...p, featured: !!v }))}
              />
              Destaque na home
            </label>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Salvando..." : "Salvar produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
