import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 text-paper">
      <section className="max-w-md text-center">
        <WifiOff className="mx-auto h-14 w-14 text-flame" />
        <h1 className="mt-5 font-display text-4xl">Você está sem internet</h1>
        <p className="mt-3 text-paper/60 normal-case">Conecte-se novamente para atualizar pedidos, cardápio e entregas.</p>
        <Link href="/" className="mt-7 inline-block rounded-xl bg-flame px-6 py-3 font-bold text-white">Tentar novamente</Link>
      </section>
    </main>
  );
}
