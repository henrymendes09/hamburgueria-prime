import { z } from "zod";

export const DEFAULT_FAQS = [
  { q: "Qual o tempo médio de entrega?", a: "Nosso tempo médio é de 35 a 50 minutos, dependendo da sua região e do movimento do dia." },
  { q: "Vocês entregam em toda a cidade?", a: "Ao inserir seu CEP no checkout, você verá se sua região está coberta e o valor da entrega." },
  { q: "Posso agendar meu pedido?", a: "Sim! No checkout, escolha a opção de entrega agendada e selecione o melhor dia e horário para você." },
  { q: "Quais formas de pagamento vocês aceitam?", a: "No site, o pagamento é por Pix, conforme disponibilidade no checkout. No recebimento, você pode escolher Pix, crédito, débito ou dinheiro. Para cartão, informe a bandeira no pedido." },
  { q: "Como funciona a política de cancelamento?", a: "Pedidos podem ser cancelados enquanto estiverem com status 'Recebido'. Após aceito pela cozinha, entre em contato com a loja." },
];
const text = (max: number) => z.string().trim().max(max);
export const siteContentSchema = z.object({
  eyebrow: text(100), title: text(200).min(1), body: text(12000).min(1),
  image: text(2048).refine(value => {
    if (!value) return true;
    if (/^\/(?!\/)/.test(value) && !value.includes("\\")) return true;
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && ["images.unsplash.com", "plus.unsplash.com", "fegqgvky55odqiiv.public.blob.vercel-storage.com"].includes(url.hostname); } catch { return false; }
  }, "Use uma imagem enviada pelo painel ou uma URL de imagem permitida."),
  imageAlt: text(200), addressLabel: text(100), address: text(300), hoursLabel: text(100), hours: text(2000),
  faqTitle: text(150).min(1), faqs: z.array(z.object({ q: text(300).min(3), a: text(4000).min(3) })).max(50),
});
export type SiteContent = z.infer<typeof siteContentSchema>;
export function resolveSiteContent(restaurant: { name: string; description?: string | null; address?: string | null; businessHours?: string | null; siteContent?: unknown }): SiteContent {
  const saved = siteContentSchema.safeParse(restaurant.siteContent);
  if (saved.success) return saved.data;
  return { eyebrow: "Nossa história", title: `Sobre a ${restaurant.name}`, body: restaurant.description || `${restaurant.name}: uma hamburgueria preparada para atender você com qualidade, agilidade e muito sabor.`, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&q=80", imageAlt: `Hambúrguer da ${restaurant.name}`, addressLabel: "Onde estamos", address: restaurant.address ?? "", hoursLabel: "Horário", hours: restaurant.businessHours ?? "", faqTitle: "Perguntas frequentes", faqs: DEFAULT_FAQS.map(item => ({ ...item })) };
}
