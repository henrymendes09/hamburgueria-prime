import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CheckoutForm } from "@/components/site/checkout-form";
import { publicUserSelect, toPublicUser } from "@/lib/public-user";
import { redirect } from "next/navigation";

export const metadata = { title: "Finalizar pedido" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ...publicUserSelect, addresses: { orderBy: { isDefault: "desc" }, select: { id: true, label: true, street: true, number: true, neighborhood: true, city: true, state: true, cep: true, isDefault: true, complement: true } } },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-ink mb-8 sm:text-4xl">Finalizar pedido</h1>
      <CheckoutForm user={{ ...toPublicUser(user), addresses: user.addresses }} />
    </div>
  );
}
