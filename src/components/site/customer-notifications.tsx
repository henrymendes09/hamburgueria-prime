"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
export function CustomerNotifications() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  if (!userId || session?.user?.blocked) return null;
  return <SignedInNotifications key={userId} userId={userId} />;
}
function SignedInNotifications({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let active = true, busy = false, refreshAgain = false, generation = 0;
    const controller = new AbortController(), seen = new Set<string>();
    async function refresh() {
      if (document.hidden || busy) return;
      busy = true;
      const requestedGeneration = generation;
      try {
        const response = await fetch("/api/notifications", { cache: "no-store", signal: controller.signal });
        if (!response.ok || !active) return;
        const data = await response.json();
        if (requestedGeneration !== generation) { refreshAgain = true; return; }
        setUnread(data.unread);
        const latest = data.items.find((item: { read: boolean }) => !item.read);
        if (latest && !seen.has(latest.id)) {
          seen.add(latest.id);
          const key = `hp-order-notification:${userId}:${latest.id}`;
          let shown = false; try { shown = sessionStorage.getItem(key) === "1"; sessionStorage.setItem(key, "1"); } catch { /* Memória protege contra repetição nesta página. */ }
          if (pathname === "/perfil/notificacoes") router.refresh();
          else if (!shown) toast.info(latest.message, { id: latest.id, action: { label: "Ver pedido", onClick: () => router.push(`/pedido/${latest.orderId}?loja=${encodeURIComponent(latest.restaurant.slug)}`) } });
        }
      } catch { /* Recupera no próximo ciclo. */ } finally { busy = false; if (refreshAgain && active) { refreshAgain = false; void refresh(); } }
    }
    function onRead(event: Event) {
      generation++;
      const count = (event as CustomEvent<{ readCount?: number }>).detail?.readCount;
      if (typeof count === "number" && Number.isFinite(count) && count > 0) setUnread(current => Math.max(0, current - count));
      for (const id of seen) toast.dismiss(id);
      if (busy) refreshAgain = true; else void refresh();
    }
    void refresh(); const timer = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh); window.addEventListener("hp-notifications-read", onRead);
    return () => { active = false; controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("hp-notifications-read", onRead); for (const id of seen) toast.dismiss(id); };
  }, [userId, router, pathname]);
  if (!userId) return null;
  return <Link href="/perfil/notificacoes" className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm font-bold shadow-lg normal-case"><Bell className="h-4 w-4" />Notificações{unread > 0 && <span className="rounded-full bg-flame px-2 text-white">{unread}</span>}</Link>;
}
