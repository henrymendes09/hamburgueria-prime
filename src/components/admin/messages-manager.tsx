"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { markContactMessageRead } from "@/actions/admin-messages";
import { Button } from "@/components/ui/button";

type Message = { id: string; name: string; email: string; phone: string | null; subject: string; message: string; read: boolean; createdAt: string };

export function MessagesManager() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ messages: Message[]; count: number } | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [saving, setSaving] = useState(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/admin/messages?view=list&filter=${filter}&page=${page}`, { cache: "no-store", signal });
      if (!response.ok) throw Error("fetch");
      const result = await response.json();
      if (!signal?.aborted) { setData(result); setError(false); }
    } catch { if (!signal?.aborted) setError(true); }
  }, [filter, page]);

  useEffect(() => {
    const controller = new AbortController();
    const initial = window.setTimeout(() => void refresh(controller.signal), 0);
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 15000);
    return () => { controller.abort(); clearTimeout(initial); clearInterval(timer); };
  }, [refresh]);

  async function markRead(message: Message) {
    setSaving(true);
    try {
      const result = await markContactMessageRead(message.id);
      if (!result.success) { toast.error(result.message); return; }
      setSelected(current => current?.id === message.id ? { ...current, read: true } : current);
      window.dispatchEvent(new Event("hp-messages-updated"));
      await refresh();
    } catch { toast.error("Não foi possível marcar a mensagem como lida. Tente novamente."); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-w-0 space-y-6 normal-case">
      <div><h1 className="font-display text-3xl text-ink">Mensagens dos clientes</h1><p className="mt-1 text-sm text-ash">Mensagens enviadas pelo formulário de contato da sua loja.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold" htmlFor="message-filter">Exibir</label>
        <select id="message-filter" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); setData(null); setSelected(null); }} className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm">
          <option value="all">Todas</option><option value="unread">Não lidas</option><option value="read">Lidas</option>
        </select>
        <Button variant="outline" onClick={() => void refresh()}>Atualizar</Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">Não foi possível carregar as mensagens. Clique em Atualizar para tentar novamente.</p>}
      {!data && !error && <p role="status">Carregando mensagens...</p>}
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <div className="min-w-0 space-y-3">
          {data?.count === 0 && <p className="rounded-2xl bg-white p-6 text-ash">Nenhuma mensagem {filter === "unread" ? "não lida" : filter === "read" ? "lida" : "recebida"}.</p>}
          {data?.messages.map(message => <button key={message.id} type="button" onClick={() => setSelected(message)} className={`w-full rounded-2xl border-2 bg-white p-4 text-left transition-colors ${selected?.id === message.id ? "border-flame" : "border-ink/5 hover:border-flame/30"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="break-all font-bold">{message.name}</span><span className={`rounded-full px-2 py-1 text-xs font-semibold ${message.read ? "bg-ink/5 text-ash" : "bg-flame/10 text-flame"}`}>{message.read ? "Lida" : "Não lida"}</span></div>
            <p className="mt-2 break-all font-semibold">{message.subject}</p><p className="mt-1 line-clamp-2 break-all text-sm text-ash">{message.message}</p>
            <time dateTime={message.createdAt} className="mt-3 block text-xs text-ash">{new Date(message.createdAt).toLocaleString("pt-BR")}</time>
          </button>)}
          {data && data.count > 20 && <div className="flex items-center justify-between gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => { setPage(page - 1); setData(null); }}>Anterior</Button><span className="text-sm">{page} / {Math.ceil(data.count / 20)}</span><Button variant="outline" disabled={page * 20 >= data.count} onClick={() => { setPage(page + 1); setData(null); }}>Próxima</Button></div>}
        </div>
        <section aria-label="Conteúdo da mensagem" className="min-w-0 self-start rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
          {selected ? <>
            <h2 className="break-all text-xl font-bold">{selected.subject}</h2>
            <dl className="mt-4 space-y-2 break-all text-sm"><div><dt className="font-bold">Cliente</dt><dd>{selected.name}</dd></div><div><dt className="font-bold">E-mail</dt><dd>{selected.email}</dd></div>{selected.phone && <div><dt className="font-bold">Telefone</dt><dd>{selected.phone}</dd></div>}<div><dt className="font-bold">Recebida em</dt><dd>{new Date(selected.createdAt).toLocaleString("pt-BR")}</dd></div></dl>
            <p className="my-6 whitespace-pre-wrap break-words text-sm leading-relaxed">{selected.message}</p>
            {!selected.read && <Button disabled={saving} onClick={() => void markRead(selected)}>{saving ? "Salvando..." : "Marcar como lida"}</Button>}
            {selected.read && <p className="text-sm font-semibold text-emerald-700">Mensagem lida</p>}
          </> : <p className="text-sm text-ash">Selecione uma mensagem para ver o conteúdo completo.</p>}
        </section>
      </div>
    </div>
  );
}
