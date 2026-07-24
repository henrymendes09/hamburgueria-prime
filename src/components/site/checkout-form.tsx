"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Address } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatMoney, formatCEP, formatPhone, formatCPF } from "@/lib/utils";
import { useCartStore, cartSubtotal, itemPrice } from "@/lib/cart-store";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/lib/validations";
import { checkoutAction } from "@/actions/checkout";
import { Truck, Store, Wallet, QrCode, CreditCard, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type UserWithAddresses = User & { addresses: Address[] };

export function CheckoutForm({ user }: { user: UserWithAddresses }) {
  const router = useRouter();
  const { items, coupon, clear } = useCartStore();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [cpf, setCpf] = useState(user.cpf ?? "");
  const [deliveryType, setDeliveryType] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [addressId, setAddressId] = useState(user.addresses[0]?.id ?? "");
  const [useNewAddress, setUseNewAddress] = useState(user.addresses.length === 0);
  const [newAddress, setNewAddress] = useState({
    label: "Casa",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [paymentTiming, setPaymentTiming] = useState<"AGORA" | "ENTREGA">("AGORA");
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<"CARTAO" | "DINHEIRO">("CARTAO");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartSubtotal(items);
  const deliveryFee =
    deliveryType === "RETIRADA" ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const discount = coupon
    ? coupon.type === "PERCENTUAL"
      ? (subtotal * coupon.value) / 100
      : Math.min(coupon.value, subtotal)
    : 0;
  const total = Math.max(subtotal + deliveryFee - discount, 0);
  const paymentMethod: "PIX" | "CARTAO" | "DINHEIRO" =
    paymentTiming === "AGORA" ? "PIX" : deliveryPaymentMethod;

  async function handleCepBlur() {
    const digits = newAddress.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setNewAddress((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // Falha silenciosa: usuário pode preencher manualmente
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }
    if (deliveryType === "ENTREGA" && !useNewAddress && !addressId) {
      toast.error("Selecione um endereço de entrega.");
      return;
    }
    if (deliveryType === "ENTREGA" && useNewAddress) {
      if (!newAddress.cep || !newAddress.street || !newAddress.number || !newAddress.neighborhood || !newAddress.city || !newAddress.state) {
        toast.error("Preencha todos os campos obrigatórios do endereço.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await checkoutAction(
      {
        name,
        phone,
        cpf: cpf || undefined,
        deliveryType,
        addressId: deliveryType === "ENTREGA" && !useNewAddress ? addressId : undefined,
        newAddress: deliveryType === "ENTREGA" && useNewAddress ? newAddress : undefined,
        scheduledFor: scheduledFor || undefined,
        paymentMethod,
        changeFor: paymentMethod === "DINHEIRO" && changeFor ? Number(changeFor) : undefined,
        notes: notes || undefined,
        couponCode: coupon?.code,
      },
      items
      );

      if (result.success) {
        clear();
        toast.success(`Pedido #${result.orderNumber} realizado com sucesso!`);
        router.push(`/pedido/${result.orderId}`);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Dados pessoais */}
        <section className="rounded-2xl border-2 border-ink/5 p-6">
          <h2 className="font-display text-xl text-ink mb-4">Dados pessoais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
            </div>
            <div>
              <Label>CPF (opcional)</Label>
              <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} />
            </div>
          </div>
        </section>

        {/* Entrega */}
        <section className="rounded-2xl border-2 border-ink/5 p-6">
          <h2 className="font-display text-xl text-ink mb-4">Entrega</h2>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setDeliveryType("ENTREGA")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold uppercase",
                deliveryType === "ENTREGA" ? "border-flame bg-flame/5 text-flame" : "border-ink/10 text-ink/60"
              )}
            >
              <Truck className="h-4 w-4" /> Entrega
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("RETIRADA")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold uppercase",
                deliveryType === "RETIRADA" ? "border-flame bg-flame/5 text-flame" : "border-ink/10 text-ink/60"
              )}
            >
              <Store className="h-4 w-4" /> Retirada
            </button>
          </div>

          {deliveryType === "ENTREGA" && (
            <div className="space-y-4">
              {user.addresses.length > 0 && (
                <div className="space-y-2">
                  {user.addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer",
                        !useNewAddress && addressId === addr.id ? "border-flame bg-flame/5" : "border-ink/10"
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mt-1"
                        checked={!useNewAddress && addressId === addr.id}
                        onChange={() => {
                          setAddressId(addr.id);
                          setUseNewAddress(false);
                        }}
                      />
                      <div className="text-sm">
                        <p className="font-bold text-ink flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> {addr.label}
                        </p>
                        <p className="text-ash normal-case">
                          {addr.street}, {addr.number} {addr.complement ? `- ${addr.complement}` : ""} —{" "}
                          {addr.neighborhood}, {addr.city}/{addr.state}
                        </p>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(true)}
                    className={cn(
                      "text-sm font-bold text-flame",
                      useNewAddress && "underline"
                    )}
                  >
                    + Usar novo endereço
                  </button>
                </div>
              )}

              {useNewAddress && (
                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={newAddress.cep}
                      onChange={(e) => setNewAddress((p) => ({ ...p, cep: formatCEP(e.target.value) }))}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                    />
                    {cepLoading && <p className="text-xs text-ash-light mt-1">Buscando endereço...</p>}
                  </div>
                  <div>
                    <Label>Rua</Label>
                    <Input value={newAddress.street} onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input value={newAddress.number} onChange={(e) => setNewAddress((p) => ({ ...p, number: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input value={newAddress.complement} onChange={(e) => setNewAddress((p) => ({ ...p, complement: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input value={newAddress.neighborhood} onChange={(e) => setNewAddress((p) => ({ ...p, neighborhood: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input value={newAddress.city} onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input maxLength={2} value={newAddress.state} onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <Label>Ponto de referência</Label>
                    <Input value={newAddress.reference} onChange={(e) => setNewAddress((p) => ({ ...p, reference: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <Label>Agendar para (opcional)</Label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>
        </section>

        {/* Pagamento */}
        <section className="rounded-2xl border-2 border-ink/5 p-6">
          <h2 className="font-display text-xl text-ink mb-4">Pagamento</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentTiming("AGORA")}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-4 text-left",
                paymentTiming === "AGORA" ? "border-flame bg-flame/5 text-flame" : "border-ink/10 text-ink/60"
              )}
            >
              <QrCode className="h-6 w-6 shrink-0" />
              <span><strong className="block text-sm uppercase">Pagar agora</strong><small className="normal-case opacity-70">PIX</small></span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentTiming("ENTREGA")}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-4 text-left",
                paymentTiming === "ENTREGA" ? "border-flame bg-flame/5 text-flame" : "border-ink/10 text-ink/60"
              )}
            >
              <Wallet className="h-6 w-6 shrink-0" />
              <span><strong className="block text-sm uppercase">{deliveryType === "ENTREGA" ? "Pagar na entrega" : "Pagar na retirada"}</strong><small className="normal-case opacity-70">Cartão ou dinheiro</small></span>
            </button>
          </div>

          {paymentTiming === "AGORA" && (
            <p className="mt-4 text-xs text-ash-light normal-case">
              O QR code PIX será exibido após a confirmação do pedido.
            </p>
          )}
          {paymentTiming === "ENTREGA" && (
            <div className="mt-4 rounded-xl bg-ink/[0.03] p-4">
              <p className="mb-3 text-sm font-bold">Como deseja pagar {deliveryType === "ENTREGA" ? "na entrega" : "na retirada"}?</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setDeliveryPaymentMethod("CARTAO")} className={cn("flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-bold uppercase", deliveryPaymentMethod === "CARTAO" ? "border-flame bg-flame/5 text-flame" : "border-ink/10 text-ink/60")}><CreditCard className="h-5 w-5" /> Cartão</button>
                <button type="button" onClick={() => setDeliveryPaymentMethod("DINHEIRO")} className={cn("flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-bold uppercase", deliveryPaymentMethod === "DINHEIRO" ? "border-flame bg-flame/5 text-flame" : "border-ink/10 text-ink/60")}><Wallet className="h-5 w-5" /> Dinheiro</button>
              </div>
              {deliveryPaymentMethod === "DINHEIRO" && (
                <div className="mt-4">
                  <Label>Troco para quanto?</Label>
                  <Input type="number" min={total} step="0.01" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} placeholder={formatMoney(total)} />
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border-2 border-ink/5 p-6">
          <Label htmlFor="notes">Observações do pedido</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </section>
      </div>

      {/* Resumo */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-2xl border-2 border-ink/5 p-6">
          <h2 className="font-display text-xl text-ink mb-4">Resumo do pedido</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex justify-between text-sm">
                <span className="text-ink normal-case">{item.quantity}x {item.name}</span>
                <span className="font-semibold">{formatMoney(itemPrice(item))}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm border-t border-ink/5 pt-3">
            <div className="flex justify-between text-ash">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ash">
              <span>Entrega</span>
              <span>{deliveryFee === 0 ? "Grátis" : formatMoney(deliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Desconto ({coupon?.code})</span>
                <span>-{formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display text-lg text-ink pt-2 border-t border-ink/5">
              <span>Total</span>
              <span className="text-flame">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between gap-3 pt-2 text-xs text-ash">
              <span>Pagamento</span>
              <span className="text-right font-semibold text-ink">{paymentTiming === "AGORA" ? "Agora via PIX" : `${deliveryPaymentMethod === "CARTAO" ? "Cartão" : "Dinheiro"} ${deliveryType === "ENTREGA" ? "na entrega" : "na retirada"}`}</span>
            </div>
          </div>
          <Button className="w-full mt-5" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando pedido..." : paymentTiming === "AGORA" ? "Pagar agora com PIX" : "Confirmar pedido"}
          </Button>
        </div>
      </div>
    </div>
  );
}
