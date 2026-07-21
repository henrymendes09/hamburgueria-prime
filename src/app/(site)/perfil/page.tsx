import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/site/profile-form";

export const metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });

  return (
    <div className="rounded-2xl border-2 border-ink/5 p-6 max-w-lg">
      <h2 className="font-display text-xl text-ink mb-5">Dados pessoais</h2>
      <ProfileForm user={user!} />
    </div>
  );
}
