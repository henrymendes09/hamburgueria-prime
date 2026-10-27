"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let active = true, busy = false;
    const controller = new AbortController(), seen = new Set<string>();
    async function refresh() {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const response = await fetch("/api/notifications", { cache: "no-store", signal: controller.signal });
        if (!response.ok || !active) return;
        const data = await response.json(); setUnread(data.unread);
        const latest = data.items.find((item: { read: boolean }) => !item.read);
        if (latest && !seen.has(latest.id)) {
          seen.add(latest.id);
          const key = `hp-order-notification:${userId}:${latest.id}`;
          let shown = false; try { shown = sessionStorage.getItem(key) === "1"; sessionStorage.setItem(key, "1"); } catch { /* Memória protege contra repetição nesta página. */ }
          if (!shown) toast.info(latest.message, { id: latest.id, action: { label: "Ver pedido", onClick: () => router.push(`/pedido/${latest.orderId}?loja=${encodeURIComponent(latest.restaurant.slug)}`) } });
        }
      } catch { /* Recupera no próximo ciclo. */ } finally { busy = false; }
    }
    void refresh(); const timer = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh); window.addEventListener("hp-notifications-read", refresh);
    return () => { active = false; controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("hp-notifications-read", refresh); for (const id of seen) toast.dismiss(id); };
  }, [userId, router]);
  if (!userId) return null;
  return <Link href="/perfil/notificacoes" className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm font-bold shadow-lg normal-case"><Bell className="h-4 w-4" />Notificações{unread > 0 && <span className="rounded-full bg-flame px-2 text-white">{unread}</span>}</Link>;
}
