import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CardManager } from "@/components/site/card-manager";

export const metadata = { title: "Cartões" };

export default async function CartoesPage() {
  const session = await auth();
  const cards = await prisma.card.findMany({ where: { userId: session!.user.id } });

  return <CardManager cards={cards} />;
}
