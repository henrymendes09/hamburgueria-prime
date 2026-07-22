import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CadastroSucessoPage({ searchParams }: { searchParams: Promise<{ loja?: string }> }) {
  const { loja } = await searchParams;
  if (!loja) notFound();
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: loja }, select: { name: true, slug: true } });
  if (!restaurant) notFound();
  const storePath = `/loja/${restaurant.slug}`;

  return <main className="flex min-h-screen items-center justify-center bg-[#f6f2ea] px-5 py-12 text-zinc-950">
    <section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
      <p className="font-bold text-emerald-600">CADASTRO CONCLUÍDO</p>
      <h1 className="mt-3 text-4xl font-black">{restaurant.name} está online</h1>
      <p className="mt-4 text-zinc-600">Este é o link público para enviar aos seus clientes:</p>
      <code className="mt-4 block break-all rounded-xl bg-zinc-100 p-4 text-sm">{storePath}</code>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Link href={storePath} className="rounded-xl bg-red-600 px-5 py-4 font-bold text-white">Abrir hamburgueria</Link>
        <Link href="/admin/login?cadastro=sucesso" className="rounded-xl border-2 border-zinc-900 px-5 py-4 font-bold">Entrar no painel</Link>
      </div>
    </section>
  </main>;
}
