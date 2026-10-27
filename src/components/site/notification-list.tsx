"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { readOrderNotifications } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export function NotificationList({ items }: { items: { id: string; orderId: string; restaurantSlug: string; title: string; message: string; read: boolean; createdAt: string }[] }) {
  const [saving, setSaving] = useState(false), router = useRouter();
  async function read() {
    setSaving(true);
    try { const result = await readOrderNotifications(); if (result.success) { router.refresh(); window.dispatchEvent(new Event("hp-notifications-read")); } else toast.error("Não foi possível atualizar as notificações."); } finally { setSaving(false); }
  }
  return <section className="space-y-4 normal-case"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-2xl">Notificações dos pedidos</h2><Button variant="outline" disabled={saving || !items.some(item => !item.read)} onClick={read}>Marcar todas como lidas</Button></div><p className="text-sm text-ash">Últimas 100 atualizações. Também enviamos os avisos ao e-mail da sua conta quando disponível.</p>{!items.length && <p>Nenhuma atualização de pedido por enquanto.</p>}{items.map(item => <article key={item.id} className={`rounded-xl border p-4 ${item.read ? "border-ink/10" : "border-flame/30 bg-flame/5"}`}><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-sm">{item.message}</p><p className="mt-2 text-xs text-ash">{new Date(item.createdAt).toLocaleString("pt-BR")}</p><Link href={`/pedido/${item.orderId}?loja=${encodeURIComponent(item.restaurantSlug)}`} className="mt-2 inline-block text-sm font-bold text-flame">Acompanhar pedido</Link></article>)}</section>;
}
