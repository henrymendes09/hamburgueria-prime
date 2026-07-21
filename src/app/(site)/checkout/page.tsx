import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CheckoutForm } from "@/components/site/checkout-form";

export const metadata = { title: "Finalizar pedido" };

export default async function CheckoutPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: { addresses: { orderBy: { isDefault: "desc" } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-ink mb-8 sm:text-4xl">Finalizar pedido</h1>
      <CheckoutForm user={user!} />
    </div>
  );
}
