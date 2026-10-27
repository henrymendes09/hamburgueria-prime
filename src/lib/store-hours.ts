import { z } from "zod";
export class OrderingClosedError extends Error {}

export const WEEK_DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const operationSchema = z.object({
  acceptingOrders: z.boolean(),
  timeZone: z.string().max(80).refine(value => { try { new Intl.DateTimeFormat("pt-BR", { timeZone: value }); return true; } catch { return false; } }, "Fuso horário inválido."),
  deliveryMin: z.number().int().min(5).max(300), deliveryMax: z.number().int().min(5).max(300),
  days: z.array(z.object({ enabled: z.boolean(), opens: time, closes: time })).length(7),
}).superRefine((value, ctx) => {
  if (value.deliveryMax < value.deliveryMin) ctx.addIssue({ code: "custom", message: "O prazo máximo deve ser maior ou igual ao mínimo." });
  value.days.forEach((day, index) => { if (day.enabled && day.opens === day.closes) ctx.addIssue({ code: "custom", path: ["days", index], message: "Abertura e fechamento precisam ter horários diferentes." }); });
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
    const start = minutes(today.opens), end = minutes(today.closes);
    if (start < end ? current >= start && current < end : current >= start) return true;
  }
  return Boolean(yesterday?.enabled && minutes(yesterday.opens) > minutes(yesterday.closes) && current < minutes(yesterday.closes));
}
export function describeHours(settings: OperationSettings | null) {
  if (!settings || !settings.days.some(day => day.enabled)) return "Horários ainda não configurados pela loja.";
  return settings.days.flatMap((day, index) => day.enabled ? [`${WEEK_DAYS[index]}: ${day.opens} às ${day.closes}${day.closes < day.opens ? " (dia seguinte)" : ""}`] : []).join(" · ");
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
