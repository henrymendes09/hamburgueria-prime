"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import { upsertCouponAction, toggleCouponAction, deleteCouponAction } from "@/actions/coupon-admin";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENTUAL" | "VALOR";
  value: number;
  maxUses: number | null;
  usedCount: number;
  minOrderValue: number;
  expiresAt: string;
  active: boolean;
  singleUsePerUser: boolean;
};

const EMPTY = {
  code: "",
  type: "PERCENTUAL" as const,
  value: 10,
  maxUses: "" as string | number,
  minOrderValue: 0,
  expiresAt: "",
  singleUsePerUser: true,
};

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await upsertCouponAction(null, {
      ...form,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      setDialogOpen(false);
      setForm(EMPTY);
    } else {
      toast.error(result.message);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    const result = await toggleCouponAction(id, active);
    if (!result.success) toast.error(result.message);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este cupom?")) return;
    const result = await deleteCouponAction(id);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Gestão de Cupons</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo cupom
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="rounded-2xl bg-white border-2 border-ink/5 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-flame/10 text-flame">
                  <Tag className="h-4 w-4" />
                </div>
                <span className="font-mono font-bold text-sm">{coupon.code}</span>
              </div>
              <button onClick={() => handleDelete(coupon.id)} className="text-ash-light hover:text-flame">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="font-display text-lg text-ink">
              {coupon.type === "PERCENTUAL" ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)} OFF`}
            </p>
            <p className="text-xs text-ash-light normal-case mt-1">
              Usado {coupon.usedCount}x{coupon.maxUses ? ` de ${coupon.maxUses}` : ""} · Válido até{" "}
              {formatDate(coupon.expiresAt)}
            </p>
            {coupon.minOrderValue > 0 && (
              <p className="text-xs text-ash-light normal-case">
                Pedido mínimo: R$ {coupon.minOrderValue.toFixed(2)}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={coupon.active} onCheckedChange={(v) => handleToggle(coupon.id, v)} />
                Ativo
              </label>
              {new Date(coupon.expiresAt) < new Date() && <Badge variant="dark">Expirado</Badge>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cupom</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div>
              <Label>Código</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="PRIME10"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof p.type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
                    <SelectItem value="VALOR">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))} required />
              </div>
              <div>
                <Label>Limite de usos (opcional)</Label>
                <Input type="number" value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} />
              </div>
              <div>
                <Label>Pedido mínimo (R$)</Label>
                <Input type="number" step="0.01" value={form.minOrderValue} onChange={(e) => setForm((p) => ({ ...p, minOrderValue: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Validade</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} required />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.singleUsePerUser} onCheckedChange={(v) => setForm((p) => ({ ...p, singleUsePerUser: !!v }))} />
              Cupom de uso único por cliente
            </label>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Salvando..." : "Criar cupom"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
