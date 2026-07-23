import { prisma } from "@/lib/prisma";
/* eslint-disable @next/next/no-img-element */
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { OrderTracking } from "@/components/site/order-tracking";
import { formatMoney, ORDER_STATUS_LABEL, PAYMENT_LABEL } from "@/lib/utils";
import { getPublicRestaurant } from "@/lib/tenant";

export const metadata = { title: "Acompanhar pedido" };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/pedido/${id}`);

  const restaurant = await getPublicRestaurant();
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, restaurantId: restaurant.id },
    include: {
      items: true,
      address: true,
      entregador: { select: { name: true, phone: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-flame">Pedido #{order.number}</span>
        <h1 className="font-display text-3xl text-ink mt-2 sm:text-4xl">
          {ORDER_STATUS_LABEL[order.status]}
        </h1>
      </div>

      <OrderTracking orderId={order.id} initialStatus={order.status} entregador={order.entregador} />

      <div className="mt-10 rounded-2xl border-2 border-ink/5 p-6">
        <h2 className="font-display text-lg text-ink mb-4">Itens do pedido</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm border-b border-ink/5 pb-3 last:border-0">
              <div>
                <p className="font-semibold text-ink normal-case">{item.quantity}x {item.productName}</p>
                {item.addonsLabel && <p className="text-xs text-ash-light normal-case">+ {item.addonsLabel}</p>}
                {item.removedLabel && <p className="text-xs text-ash-light normal-case">Sem {item.removedLabel}</p>}
              </div>
              <span className="font-semibold">{formatMoney(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 text-sm border-t border-ink/5 pt-4">
          <div className="flex justify-between text-ash"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
          <div className="flex justify-between text-ash"><span>Entrega</span><span>{formatMoney(order.deliveryFee)}</span></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700"><span>Desconto</span><span>-{formatMoney(order.discount)}</span></div>
          )}
          <div className="flex justify-between font-display text-lg text-ink pt-2 border-t border-ink/5">
            <span>Total</span><span className="text-flame">{formatMoney(order.total)}</span>
          </div>
          <div className="flex justify-between text-ash pt-2">
            <span>Pagamento</span><span>{PAYMENT_LABEL[order.paymentMethod]}</span>
          </div>
        </div>

        {order.paymentMethod === "PIX" && order.pixQrCodeBase64 && order.pixQrCode && (
          <div className="mt-6 rounded-2xl border-2 border-flame/20 bg-flame/5 p-5 text-center">
            <h3 className="font-display text-xl text-ink">Pague com Pix</h3>
            <p className="mt-1 text-sm normal-case text-ash">Escaneie o QR Code ou copie o código abaixo.</p>
            <img
              src={`data:image/png;base64,${order.pixQrCodeBase64}`}
              alt="QR Code para pagamento Pix"
              className="mx-auto my-4 h-56 w-56 rounded-xl bg-white p-2"
            />
            <div className="rounded-xl bg-white p-3 text-left text-xs normal-case text-ash break-all select-all">
              {order.pixQrCode}
            </div>
          </div>
        )}

        {order.address && (
          <div className="mt-4 border-t border-ink/5 pt-4 text-sm text-ash normal-case">
            <p className="font-semibold text-ink mb-1">Endereço de entrega</p>
            <p>
              {order.address.street}, {order.address.number} — {order.address.neighborhood},{" "}
              {order.address.city}/{order.address.state}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
