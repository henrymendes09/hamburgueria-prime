import { updateRestaurantSettingsAction } from "@/actions/restaurant-settings";
import { prisma } from "@/lib/prisma";
import { requireRestaurantAdmin } from "@/lib/tenant";
import { RestaurantLogoField } from "@/components/admin/restaurant-logo-field";
import { SettingsSubmitButton } from "@/components/admin/settings-submit-button";

export const metadata = { title: "Configurações da loja" };

export default async function ConfiguracoesPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const [{ restaurantId }, params] = await Promise.all([requireRestaurantAdmin(), searchParams]);
  const restaurant = await prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h1 className="font-display text-3xl text-ink">Configurações</h1><p className="mt-1 normal-case text-ash">Personalize os dados visíveis na sua hamburgueria.</p></div>
    {params.salvo && <p className="rounded-xl bg-emerald-100 p-4 text-emerald-800">Configurações salvas.</p>}
    {params.erro && <p className="rounded-xl bg-red-100 p-4 text-red-800">Verifique os dados. O domínio pode já estar em uso.</p>}
    <form action={updateRestaurantSettingsAction} noValidate className="grid gap-5 rounded-2xl bg-white p-6 md:grid-cols-2">
      <Field label="Nome da hamburgueria" name="name" value={restaurant.name} required />
      <RestaurantLogoField initialValue={restaurant.logoUrl ?? ""} />
      <Field label="Cor principal" name="primaryColor" value={restaurant.primaryColor} type="color" />
      <Field label="Domínio próprio" name="customDomain" value={restaurant.customDomain ?? ""} placeholder="pedidos.minhaloja.com.br" />
      <Field label="Telefone" name="phone" value={restaurant.phone ?? ""} />
      <Field label="WhatsApp" name="whatsapp" value={restaurant.whatsapp ?? ""} />
      <Field label="E-mail comercial" name="email" value={restaurant.email ?? ""} type="email" />
      <Field label="CNPJ" name="cnpj" value={restaurant.cnpj ?? ""} />
      <Field label="Endereço" name="address" value={restaurant.address ?? ""} />
      <Field label="Horários" name="businessHours" value={restaurant.businessHours ?? ""} placeholder="Terça a domingo, 18h às 23h" />
      <Field label="Chave PIX" name="pixKey" value={restaurant.pixKey ?? ""} />
      <Field label="Taxa de entrega" name="deliveryFee" value={restaurant.deliveryFee} type="number" step="0.01" required />
      <Field label="Frete grátis acima de" name="freeDeliveryThreshold" value={restaurant.freeDeliveryThreshold ?? ""} type="number" step="0.01" />
      <label className="grid gap-2 font-semibold md:col-span-2">Descrição<textarea name="description" defaultValue={restaurant.description ?? ""} maxLength={300} className="min-h-24 rounded-xl border p-3 font-normal" /></label>
      <SettingsSubmitButton />
    </form>
  </div>;
}

function Field({ label, name, value, ...props }: { label: string; name: string; value: string | number; [key: string]: unknown }) {
  return <label className="grid gap-2 font-semibold">{label}<input name={name} defaultValue={value} className="rounded-xl border p-3 font-normal" {...props} /></label>;
}
