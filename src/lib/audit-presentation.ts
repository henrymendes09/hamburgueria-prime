import { formatMoney, ORDER_STATUS_LABEL, PAYMENT_LABEL } from "./utils";
import { resolveOperation, WEEK_DAYS } from "./store-hours";

type Change = { label: string; before: string; after: string };
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const labels: Record<string, string> = {
  name: "Nome", price: "Preço", promoPrice: "Preço promocional", available: "Disponível para venda", featured: "Destaque no cardápio", ingredients: "Ingredientes", description: "Descrição", status: "Situação", paymentStatus: "Pagamento", paymentFee: "Taxa do pagamento", deliveryPayout: "Repasse da entrega", deliveryFee: "Taxa de entrega", deliveryFeePerKm: "Taxa por quilômetro", deliveryRadiusKm: "Raio de entrega (km)", freeDeliveryThreshold: "Compra mínima para frete grátis", subtotal: "Valor dos produtos", total: "Total do pedido", discount: "Desconto", paymentMethod: "Forma de pagamento", paymentCardBrand: "Bandeira do cartão", businessHours: "Horários de funcionamento", blocked: "Bloqueado", role: "Perfil de acesso", code: "Código do cupom", type: "Tipo de desconto", value: "Valor do desconto", minOrder: "Pedido mínimo", maxUses: "Limite de usos", expiresAt: "Validade", active: "Ativo", sortOrder: "Ordem de exibição", order: "Ordem de exibição", storeCep: "CEP da loja", address: "Endereço", primaryColor: "Cor principal", customDomain: "Domínio", notes: "Observações", deliveryType: "Forma de recebimento", scheduledFor: "Agendamento", eyebrow: "Texto acima do título", title: "Título", body: "Texto sobre a loja", imageAlt: "Descrição da imagem", addressLabel: "Título do endereço", hoursLabel: "Título dos horários", hours: "Horários exibidos", faqTitle: "Título das perguntas frequentes", acceptingOrders: "Recebimento de pedidos", timeZone: "Fuso horário",
};
const money = new Set(["price", "promoPrice", "paymentFee", "deliveryPayout", "deliveryFee", "deliveryFeePerKm", "freeDeliveryThreshold", "subtotal", "total", "discount", "minOrder"]);
Object.assign(labels, { minOrderValue: "Pedido mínimo", singleUsePerUser: "Um uso por cliente", icon: "Ícone da categoria" });
money.add("minOrderValue");
const protectedFields: Record<string, string> = { passwordHash: "Senha", email: "E-mail", phone: "Telefone", cpf: "CPF", pixKey: "Chave Pix" };
const enums: Record<string, string> = { ...ORDER_STATUS_LABEL, ...PAYMENT_LABEL, PAGO: "Pago", PENDENTE: "Pendente", ESTORNADO: "Estornado", FALHOU: "Falhou", ACTIVE: "Ativa", TRIAL: "Em avaliação", SUSPENDED: "Suspensa", CANCELLED: "Cancelada", ADMIN: "Administrador", SUPER_ADMIN: "Administrador da plataforma", CLIENTE: "Cliente", ENTREGADOR: "Entregador", PERCENT: "Percentual", PERCENTAGE: "Percentual", FIXED: "Valor fixo", ENTREGA: "Entrega", RETIRADA: "Retirada" };
function display(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return money.has(key) ? formatMoney(value) : String(value);
  if (typeof value !== "string") return "Informação atualizada";
  if (key === "expiresAt" || key === "scheduledFor") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Não informado";
  }
  if (key === "type" && value === "PERCENTUAL") return "Percentual";
  if (key === "type" && value === "VALOR") return "Valor em reais";
  if (key === "status") {
    const storeLabels: Record<string, string> = { TRIALING: "Em avaliação", PAST_DUE: "Pagamento em atraso", CANCELED: "Cancelada" };
    if (storeLabels[value]) return storeLabels[value];
  }
  return enums[value] ?? value;
}
function zoneLabel(value?: string) {
  const zones: Record<string, string> = { "America/Sao_Paulo": "Brasília", "America/Manaus": "Manaus", "America/Rio_Branco": "Rio Branco", "America/Noronha": "Fernando de Noronha" };
  return value ? zones[value] ?? "Fuso personalizado" : "Não configurado";
}
function dayLabel(day: NonNullable<ReturnType<typeof resolveOperation>>["days"][number] | undefined) {
  return !day?.enabled ? "Fechado" : `${day.opens} às ${day.closes}${day.closes < day.opens ? " (dia seguinte)" : ""}; pedidos até ${day.ordersUntil ?? day.closes}${(day.ordersUntil ?? day.closes) < day.opens ? " (dia seguinte)" : ""}`;
}
/** Only named business fields are rendered. Unknown keys, IDs and secrets never become UI text. */
export function auditChanges(before: unknown, after: unknown, fields: string[]): Change[] {
  const old = object(before), next = object(after), changes: Change[] = [];
  const add = (label: string, a: string, b: string) => { if (a !== b) changes.push({ label, before: a, after: b }); };
  for (const key of fields) {
    if (protectedFields[key]) { changes.push({ label: protectedFields[key], before: "Valor protegido", after: "Atualizado com segurança" }); continue; }
    if (key === "businessHours" && fields.includes("operationSettings")) continue;
    if (key === "operationSettings") {
      const a = resolveOperation(old[key]), b = resolveOperation(next[key]);
      add("Recebimento de pedidos", a ? a.acceptingOrders ? "Ativado" : "Pausado" : "Não configurado", b ? b.acceptingOrders ? "Ativado" : "Pausado" : "Não configurado");
      add("Prazo de entrega", a ? `${a.deliveryMin} a ${a.deliveryMax} minutos` : "Não configurado", b ? `${b.deliveryMin} a ${b.deliveryMax} minutos` : "Não configurado");
      add("Fuso horário", zoneLabel(a?.timeZone), zoneLabel(b?.timeZone));
      WEEK_DAYS.forEach((name, i) => add(name, dayLabel(a?.days[i]), dayLabel(b?.days[i])));
      continue;
    }
    if (key === "siteContent") {
      const a = object(old[key]), b = object(next[key]);
      for (const field of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (field === "faqs") {
          const faqs = (value: unknown) => Array.isArray(value) ? value.map(object) : [];
          const previous = faqs(a.faqs), current = faqs(b.faqs);
          for (let i = 0; i < Math.max(previous.length, current.length); i++) {
            const text = (faq: Record<string, unknown> | undefined) => faq ? `${String(faq.q ?? "")} — ${String(faq.a ?? "")}` : "Não cadastrada";
            add(`Pergunta frequente ${i + 1}`, text(previous[i]), text(current[i]));
          }
        } else if (field === "image") { if (a[field] !== b[field]) changes.push({ label: "Imagem da página Sobre", before: a[field] ? "Imagem anterior" : "Sem imagem", after: b[field] ? "Nova imagem" : "Sem imagem" }); }
        else if (labels[field]) add(labels[field], display(field, a[field]), display(field, b[field]));
      }
      continue;
    }
    if (["image", "logoUrl"].includes(key)) { changes.push({ label: key === "image" ? "Imagem" : "Logotipo", before: old[key] ? "Imagem anterior" : "Sem imagem", after: next[key] ? "Nova imagem" : "Sem imagem" }); continue; }
    const references: Record<string, string> = { categoryId: "Categoria", entregadorId: "Entregador", addonId: "Adicional", productId: "Produto" };
    if (references[key]) { changes.push({ label: references[key], before: old[key] ? "Vínculo anterior" : "Não vinculado", after: next[key] ? "Vínculo atualizado" : "Vínculo removido" }); continue; }
    if (labels[key]) add(labels[key], display(key, old[key]), display(key, next[key]));
  }
  return changes.length ? changes : [{ label: "Informações do cadastro", before: before ? "Cadastro anterior" : "Não existia", after: after ? "Cadastro atualizado" : "Cadastro excluído" }];
}
export function auditRecordName(before: unknown, after: unknown) {
  const value = object(after).name ?? object(before).name ?? object(after).code ?? object(before).code;
  return typeof value === "string" ? value : "";
}
