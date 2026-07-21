"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertAddonAction } from "@/actions/products";

export function AddonFormDialog({
  open,
  onOpenChange,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { id: string; name: string; price: number; type: string };
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price ?? 0);
  const [type, setType] = useState(initialValues?.type ?? "EXTRA");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await upsertAddonAction(initialValues?.id ?? null, { name, price, type });
    setIsSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      setName("");
      setPrice(0);
      setType("EXTRA");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? "Editar adicional" : "Novo adicional"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXTRA">Adicional extra (com custo)</SelectItem>
                <SelectItem value="REMOVER">Ingrediente removível</SelectItem>
                <SelectItem value="PONTO">Ponto da carne</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bacon, Cheddar, Mal passado..." required />
          </div>
          <div>
            <Label>Preço adicional (R$) — deixe 0 se não houver custo</Label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Salvando..." : "Salvar adicional"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
