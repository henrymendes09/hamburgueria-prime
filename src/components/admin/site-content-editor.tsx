"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSiteContentAction } from "@/actions/site-content";
import type { SiteContent } from "@/lib/site-content";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";

export function SiteContentEditor({ initialValue }: { initialValue: SiteContent }) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  function field(key: keyof Omit<SiteContent, "faqs">, label: string, maxLength: number, multiline = false) {
    const props = { value: value[key], maxLength, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(current => ({ ...current, [key]: event.target.value })), className: "w-full rounded-xl border border-ink/15 bg-white p-3 font-normal" };
    return <label className={`grid gap-2 text-sm font-semibold ${multiline ? "sm:col-span-2" : ""}`}>{label}{multiline ? <textarea {...props} rows={6} /> : <input {...props} />}</label>;
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try { const result = await saveSiteContentAction(value); if (!result.success) toast.error(result.message); else { toast.success(result.message); router.refresh(); } }
    catch { toast.error("Não foi possível salvar. Tente novamente."); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} className="mx-auto max-w-4xl space-y-6 normal-case">
    <div><h1 className="font-display text-3xl">Conteúdo do site</h1><p className="mt-1 text-sm text-ash">Edite a página Sobre e as perguntas frequentes exibidas em Contato.</p></div>
    <fieldset disabled={saving} className="space-y-6">
      <section className="space-y-5 rounded-2xl bg-white p-5 sm:p-6"><h2 className="font-display text-2xl">Página Sobre</h2>
        <div className="grid gap-4 sm:grid-cols-2">{field("eyebrow", "Chamada acima do título", 100)}{field("title", "Título da página", 200)}{field("body", "Texto sobre a loja", 12000, true)}{field("imageAlt", "Descrição da imagem", 200)}{field("addressLabel", "Título do endereço", 100)}{field("address", "Endereço exibido no Sobre", 300)}{field("hoursLabel", "Título dos horários", 100)}{field("hours", "Horários exibidos no Sobre", 300)}</div>
        <div><p className="mb-2 text-sm font-semibold">Imagem da página Sobre</p><ImageUploader value={value.image} onChange={image => setValue(current => ({ ...current, image }))} /></div>
      </section>
      <section className="space-y-5 rounded-2xl bg-white p-5 sm:p-6"><h2 className="font-display text-2xl">Perguntas frequentes</h2>{field("faqTitle", "Título da seção de perguntas", 150)}
        <p className="text-sm text-ash">Edite os textos, altere a ordem ou exclua perguntas. As alterações são publicadas ao salvar.</p>
        {value.faqs.length === 0 && <p className="text-sm text-ash">Nenhuma pergunta. A seção ficará oculta no site.</p>}
        {value.faqs.map((item, index) => <div key={index} className="space-y-3 rounded-xl border border-ink/10 p-4">
          <label className="grid gap-2 text-sm font-semibold">Pergunta {index + 1}<input value={item.q} maxLength={300} required className="w-full rounded-xl border p-3 font-normal" onChange={event => setValue(current => ({ ...current, faqs: current.faqs.map((faq, i) => i === index ? { ...faq, q: event.target.value } : faq) }))} /></label>
          <label className="grid gap-2 text-sm font-semibold">Resposta {index + 1}<textarea value={item.a} maxLength={4000} required rows={3} className="w-full rounded-xl border p-3 font-normal" onChange={event => setValue(current => ({ ...current, faqs: current.faqs.map((faq, i) => i === index ? { ...faq, a: event.target.value } : faq) }))} /></label>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={index === 0} onClick={() => setValue(current => { const faqs = [...current.faqs]; [faqs[index - 1], faqs[index]] = [faqs[index], faqs[index - 1]]; return { ...current, faqs }; })}>Subir</Button><Button type="button" variant="outline" disabled={index === value.faqs.length - 1} onClick={() => setValue(current => { const faqs = [...current.faqs]; [faqs[index + 1], faqs[index]] = [faqs[index], faqs[index + 1]]; return { ...current, faqs }; })}>Descer</Button><Button type="button" variant="ghost" className="text-red-600" onClick={() => setValue(current => ({ ...current, faqs: current.faqs.filter((_, i) => i !== index) }))}>Excluir pergunta {index + 1}</Button></div>
        </div>)}
        <Button type="button" variant="outline" disabled={value.faqs.length >= 50} onClick={() => setValue(current => ({ ...current, faqs: [...current.faqs, { q: "", a: "" }] }))}>Adicionar pergunta</Button>
      </section>
      <Button type="submit">{saving ? "Salvando..." : "Salvar conteúdo"}</Button>
    </fieldset>
  </form>;
}
