"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertCategoryAction } from "@/actions/products";

export function CategoryFormDialog({
  open,
  onOpenChange,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { id: string; name: string; icon: string; order: number };
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? "🍔");
  const [order, setOrder] = useState(initialValues?.order ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await upsertCategoryAction(initialValues?.id ?? null, { name, icon, order });
    setIsSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      setName("");
      setIcon("🍔");
      setOrder(0);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Ícone (emoji)</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} required />
          </div>
          <div>
            <Label>Ordem de exibição</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Salvando..." : "Salvar categoria"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
