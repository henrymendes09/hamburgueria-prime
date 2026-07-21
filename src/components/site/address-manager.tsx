"use client";

import { useState } from "react";
import { Address } from "@prisma/client";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCEP } from "@/lib/utils";
import { upsertAddressAction, deleteAddressAction } from "@/actions/addresses";

const EMPTY = {
  label: "Casa",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  reference: "",
  isDefault: false,
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await upsertAddressAction(null, form);
    setIsSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      setForm(EMPTY);
      setShowForm(false);
    } else {
      toast.error(result.message);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAddressAction(id);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <div className="space-y-4">
      {addresses.map((addr) => (
        <div key={addr.id} className="flex items-start justify-between rounded-2xl border-2 border-ink/5 p-5">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-flame shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-ink flex items-center gap-1.5">
                {addr.label}
                {addr.isDefault && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
              </p>
              <p className="text-sm text-ash normal-case">
                {addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`} — {addr.neighborhood}, {addr.city}/{addr.state}
              </p>
              <p className="text-xs text-ash-light">{addr.cep}</p>
            </div>
          </div>
          <button onClick={() => handleDelete(addr.id)} className="text-ash-light hover:text-flame">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-ink/5 p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Identificação</Label>
              <Input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Casa, Trabalho..." />
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={form.cep} onChange={(e) => setForm((p) => ({ ...p, cep: formatCEP(e.target.value) }))} />
            </div>
            <div>
              <Label>Rua</Label>
              <Input value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={form.number} onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))} />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input value={form.complement} onChange={(e) => setForm((p) => ({ ...p, complement: e.target.value }))} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.neighborhood} onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <Label>UF</Label>
              <Input maxLength={2} value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <Checkbox checked={form.isDefault} onCheckedChange={(v) => setForm((p) => ({ ...p, isDefault: !!v }))} />
            Definir como endereço padrão
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar endereço"}</Button>
            {addresses.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar endereço
        </Button>
      )}
    </div>
  );
}
