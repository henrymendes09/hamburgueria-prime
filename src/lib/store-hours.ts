import { z } from "zod";
export class OrderingClosedError extends Error {}

export const WEEK_DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const operationSchema = z.object({
  acceptingOrders: z.boolean(),
  timeZone: z.string().max(80).refine(value => { try { new Intl.DateTimeFormat("pt-BR", { timeZone: value }); return true; } catch { return false; } }, "Fuso horário inválido."),
  deliveryMin: z.number().int().min(5).max(300), deliveryMax: z.number().int().min(5).max(300),
  days: z.array(z.object({ enabled: z.boolean(), opens: time, closes: time, ordersUntil: time.optional() })).length(7),
}).superRefine((value, ctx) => {
  if (value.deliveryMax < value.deliveryMin) ctx.addIssue({ code: "custom", message: "O prazo máximo deve ser maior ou igual ao mínimo." });
  value.days.forEach((day, index) => { if (day.enabled && day.opens === day.closes) ctx.addIssue({ code: "custom", path: ["days", index], message: "Abertura e fechamento precisam ter horários diferentes." }); });
  value.days.forEach((day, index) => {
    if (!day.enabled || !day.ordersUntil) return;
    const start = minutes(day.opens), duration = (minutes(day.closes) - start + 1440) % 1440;
    const cutoff = (minutes(day.ordersUntil) - start + 1440) % 1440;
    if (cutoff === 0 || cutoff > duration) ctx.addIssue({ code: "custom", path: ["days", index, "ordersUntil"], message: `${WEEK_DAYS[index]}: o limite para pedidos deve ficar entre a abertura e o fechamento.` });
  });
  if (value.acceptingOrders && !value.days.some(day => day.enabled)) ctx.addIssue({ code: "custom", message: "Selecione pelo menos um dia de funcionamento." });
});
export type OperationSettings = z.infer<typeof operationSchema>;
export function operationDefaults(): OperationSettings {
  return { acceptingOrders: false, timeZone: "America/Sao_Paulo", deliveryMin: 35, deliveryMax: 50, days: WEEK_DAYS.map(() => ({ enabled: false, opens: "18:00", closes: "23:00" })) };
}
export function resolveOperation(value: unknown): OperationSettings | null {
  const parsed = operationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
function minutes(time: string) { const [hours, min] = time.split(":").map(Number); return hours * 60 + min; }
export function isWithinStoreHours(settings: OperationSettings, at: Date) {
  const local = new Intl.DateTimeFormat("en-US", { timeZone: settings.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const part = (type: string) => local.find(item => item.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));
  const current = Number(part("hour")) * 60 + Number(part("minute"));
  const today = settings.days[day], yesterday = settings.days[(day + 6) % 7];
  if (today?.enabled) {
    const start = minutes(today.opens), end = minutes(today.ordersUntil ?? today.closes);
    if (start < end ? current >= start && current < end : current >= start) return true;
  }
  return Boolean(yesterday?.enabled && minutes(yesterday.opens) > minutes(yesterday.ordersUntil ?? yesterday.closes) && current < minutes(yesterday.ordersUntil ?? yesterday.closes));
}
export function describeHours(settings: OperationSettings | null) {
  if (!settings || !settings.days.some(day => day.enabled)) return "Horários ainda não configurados pela loja.";
  const names = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const groups = new Map<string, { days: number[]; opens: string; closes: string }>();
  [1, 2, 3, 4, 5, 6, 0].forEach((dayIndex, position) => {
    const day = settings.days[dayIndex];
    if (!day.enabled) return;
    const key = `${day.opens}-${day.closes}`, group = groups.get(key) ?? { days: [], opens: day.opens, closes: day.closes };
    group.days.push(position); groups.set(key, group);
  });
  const hour = (value: string) => `${Number(value.slice(0, 2))}h${value.endsWith(":00") ? "" : value.slice(3)}`;
  return [...groups.values()].map(({ days, opens, closes }, index) => {
    const contiguous = days.every((day, i) => i === 0 || day === days[i - 1] + 1);
    const labels = days.map(day => names[day]);
    const daysText = days.length === 7 ? "todos os dias" : contiguous && days.length >= 3 ? `de ${labels[0]} a ${labels.at(-1)}` : labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
    const sentence = `${daysText}, das ${hour(opens)} às ${hour(closes)}${closes < opens ? " do dia seguinte" : ""}.`;
    return index === 0 ? `Trabalhamos ${sentence}` : sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }).join("\n");
}
export function storeStatus(raw: unknown, at = new Date()) {
  const settings = resolveOperation(raw);
  const open = Boolean(settings?.acceptingOrders && isWithinStoreHours(settings, at));
  const hours = describeHours(settings);
  return { open, hours, timeZone: settings?.timeZone ?? "America/Sao_Paulo", deliveryEstimate: settings ? `${settings.deliveryMin} a ${settings.deliveryMax} minutos` : "Prazo a confirmar com a loja", message: open ? "Loja aberta" : `A loja está fechada para novos pedidos. ${hours}` };
}
export function validateOrderSchedule(raw: unknown, scheduledFor?: string, at = new Date()) {
  const status = storeStatus(raw, at), settings = resolveOperation(raw);
  if (!status.open) return status.message;
  if (scheduledFor) {
    const scheduled = new Date(scheduledFor);
    if (!Number.isFinite(scheduled.getTime()) || scheduled <= at || scheduled.getTime() - at.getTime() > 7 * 86400000) return "Agende para um horário futuro nos próximos 7 dias.";
    if (!settings || !isWithinStoreHours(settings, scheduled)) return "O horário agendado está fora do funcionamento da loja.";
  }
  return null;
}
