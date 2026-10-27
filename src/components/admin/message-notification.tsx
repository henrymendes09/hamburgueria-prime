"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, X } from "lucide-react";

export function MessageNotification({ accountKey }: { accountKey: string }) {
  const [notice, setNotice] = useState<{ unread: number; latestId: string | null } | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const key = `hp-message-notice:${accountKey}`;

  useEffect(() => {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/admin/messages", { cache: "no-store", signal: controller.signal });
        if (response.ok && active) setNotice(await response.json());
        else if (active) setNotice(null);
      } catch { /* A próxima consulta tenta novamente sem interromper o painel. */ }
      finally { pending = false; }
    }
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("hp-messages-updated", refresh);
    return () => { active = false; controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("hp-messages-updated", refresh); };
  }, []);

  if (!notice?.unread || !notice.latestId || dismissed === notice.latestId) return null;
  // A leitura acontece apenas após a montagem no navegador.
  let saved: string | null = null;
  try { saved = sessionStorage.getItem(key); } catch { /* Armazenamento opcional. */ }
  if (saved === notice.latestId) return null;

  function dismiss() {
    setDismissed(notice!.latestId);
    try { sessionStorage.setItem(key, notice!.latestId!); } catch { /* Mantém o fechamento nesta página. */ }
  }

  return (
    <aside role="status" aria-label="Novas mensagens de clientes" className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-ink/10 bg-white p-5 shadow-xl normal-case">
      <button type="button" onClick={dismiss} aria-label="Fechar aviso de mensagens" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/5"><X className="h-4 w-4" /></button>
      <MessageSquare className="mb-2 h-6 w-6 text-flame" />
      <p className="pr-5 font-bold text-ink">Você tem {notice.unread} {notice.unread === 1 ? "mensagem não lida" : "mensagens não lidas"}</p>
      <Link href="/admin/mensagens" onClick={dismiss} className="mt-3 inline-flex rounded-full bg-flame px-4 py-2 text-sm font-bold text-white">Ver mensagens</Link>
    </aside>
  );
}
