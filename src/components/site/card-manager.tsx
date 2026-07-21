"use client";

import { useState } from "react";
import { Card as CardModel } from "@prisma/client";
import { toast } from "sonner";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCardAction, deleteCardAction } from "@/actions/cards";

const EMPTY = {
  brand: "VISA" as const,
  holderName: "",
  number: "",
  expMonth: "",
  expYear: "",
  cvv: "",
};

export function CardManager({ cards }: { cards: CardModel[] }) {
  const [showForm, setShowForm] = useState(cards.length === 0);
  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await addCardAction({
      ...form,
      expMonth: Number(form.expMonth),
      expYear: Number(form.expYear),
    });
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
    const result = await deleteCardAction(id);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 normal-case">
        Armazenamos apenas os últimos 4 dígitos do cartão para exibição — o CVV nunca é salvo.
        Para cobranças reais, conecte um gateway de pagamento (ex. Mercado Pago/Stripe).
      </div>

      {cards.map((card) => (
        <div key={card.id} className="flex items-center justify-between rounded-2xl border-2 border-ink/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5">
              <CreditCard className="h-5 w-5 text-ink" />
            </div>
            <div>
              <p className="font-bold text-ink">{card.brand} •••• {card.last4}</p>
              <p className="text-xs text-ash-light normal-case">
                {card.holderName} · Válido até {String(card.expMonth).padStart(2, "0")}/{card.expYear}
              </p>
            </div>
          </div>
          <button onClick={() => handleDelete(card.id)} className="text-ash-light hover:text-flame">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-ink/5 p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Bandeira</Label>
              <Select value={form.brand} onValueChange={(v) => setForm((p) => ({ ...p, brand: v as typeof p.brand }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VISA">Visa</SelectItem>
                  <SelectItem value="MASTERCARD">Mastercard</SelectItem>
                  <SelectItem value="ELO">Elo</SelectItem>
                  <SelectItem value="AMEX">Amex</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Nome impresso no cartão</Label>
              <Input value={form.holderName} onChange={(e) => setForm((p) => ({ ...p, holderName: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>Número do cartão</Label>
              <Input value={form.number} onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))} maxLength={16} />
            </div>
            <div>
              <Label>Mês</Label>
              <Input value={form.expMonth} onChange={(e) => setForm((p) => ({ ...p, expMonth: e.target.value }))} placeholder="MM" maxLength={2} />
            </div>
            <div>
              <Label>Ano</Label>
              <Input value={form.expYear} onChange={(e) => setForm((p) => ({ ...p, expYear: e.target.value }))} placeholder="AAAA" maxLength={4} />
            </div>
            <div>
              <Label>CVV</Label>
              <Input value={form.cvv} onChange={(e) => setForm((p) => ({ ...p, cvv: e.target.value }))} maxLength={4} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar cartão"}</Button>
            {cards.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar cartão
        </Button>
      )}
    </div>
  );
}
