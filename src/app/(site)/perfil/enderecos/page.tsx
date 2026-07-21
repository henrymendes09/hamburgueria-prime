import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AddressManager } from "@/components/site/address-manager";

export const metadata = { title: "Endereços" };

export default async function EnderecosPage() {
  const session = await auth();
  const addresses = await prisma.address.findMany({
    where: { userId: session!.user.id },
    orderBy: { isDefault: "desc" },
  });

  return <AddressManager addresses={addresses} />;
}
