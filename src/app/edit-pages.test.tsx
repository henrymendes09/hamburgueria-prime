// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const data = vi.hoisted(() => ({ restaurant: vi.fn(), plans: vi.fn(), profile: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { restaurant: { findUniqueOrThrow: data.restaurant, findMany: async () => [] }, plan: { findMany: data.plans }, subscriptionPayment: { findMany: async () => [] }, user: { findUnique: data.profile } } }));
vi.mock("@/lib/tenant", () => ({ requireRestaurantAdmin: async () => ({ restaurantId: "test-store" }), requirePlatformAdmin: async () => ({}) }));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "test-user" } }) }));
vi.mock("@/actions/restaurant-settings", () => ({ updateRestaurantSettingsAction: vi.fn() }));
vi.mock("@/actions/platform", () => ({ setRestaurantStatusAction: vi.fn(), updatePlanAction: vi.fn() }));
vi.mock("@/actions/profile", () => ({ updateProfileAction: vi.fn() }));
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
import SettingsPage from "./admin/(dashboard)/configuracoes/page";
import PlatformPage from "./super-admin/page";
import ProfilePage from "./(site)/perfil/page";
afterEach(cleanup);
it("loads all store settings and replaces stale drafts with refreshed saved data", async () => {
  const restaurant = { name: "Loja salva", logoUrl: "/logo-salvo.webp", primaryColor: "#ff0000", customDomain: "loja.example.com", phone: "11999990000", whatsapp: "11888880000", email: "store@example.invalid", cnpj: "12345678000100", address: "Rua salva, 10", businessHours: "18h às 23h", pixKey: "pix@example.invalid", storeCep: "01001-000", deliveryFee: 7.9, deliveryFeePerKm: 2, deliveryRadiusKm: 10, freeDeliveryThreshold: 90, description: "Descrição salva", updatedAt: new Date("2026-10-01T10:00:00Z") };
  data.restaurant.mockResolvedValue(restaurant);
  const view = render(await SettingsPage({ searchParams: Promise.resolve({}) }));
  for (const [label, value] of [["Nome da hamburgueria", restaurant.name], ["Domínio próprio", restaurant.customDomain], ["Telefone", restaurant.phone], ["WhatsApp", restaurant.whatsapp], ["E-mail comercial", restaurant.email], ["CNPJ", restaurant.cnpj], ["Endereço", restaurant.address], ["Horários", restaurant.businessHours], ["Chave PIX", restaurant.pixKey], ["CEP da loja", restaurant.storeCep], ["Descrição", restaurant.description]]) {
    expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe(value);
  }
  expect((screen.getByLabelText("Taxa base de entrega") as HTMLInputElement).value).toBe("7.9");
  expect((screen.getByLabelText("Valor por km") as HTMLInputElement).value).toBe("2");
  expect((screen.getByLabelText("Raio máximo de entrega (km)") as HTMLInputElement).value).toBe("10");
  expect((screen.getByLabelText("Frete grátis acima de") as HTMLInputElement).value).toBe("90");
  fireEvent.change(screen.getByLabelText("Nome da hamburgueria"), { target: { value: "Rascunho" } });
  data.restaurant.mockResolvedValue({ ...restaurant, name: "Nome atualizado", logoUrl: "/novo-logo.webp", updatedAt: new Date("2026-10-01T11:00:00Z") });
  view.rerender(await SettingsPage({ searchParams: Promise.resolve({}) }));
  expect((screen.getByLabelText("Nome da hamburgueria") as HTMLInputElement).value).toBe("Nome atualizado");
  expect(screen.getByRole("img", { name: "Preview" }).getAttribute("src")).toBe("/novo-logo.webp");
});
it("loads saved plan prices, limits and features and refreshes edited inputs", async () => {
  const plan = { id: "plan1", name: "Plano salvo", monthlyPrice: 99, yearlyPrice: 990, maxUsers: 5, features: ["Pedidos", "Equipe"], updatedAt: new Date("2026-10-01T10:00:00Z"), _count: { subscriptions: 2 } };
  data.plans.mockResolvedValue([plan]);
  const view = render(await PlatformPage());
  expect((screen.getByLabelText("Preço mensal") as HTMLInputElement).value).toBe("99");
  expect((screen.getByLabelText("Preço anual") as HTMLInputElement).value).toBe("990");
  expect((screen.getByLabelText("Limite de usuários (vazio = ilimitado)") as HTMLInputElement).value).toBe("5");
  expect((screen.getByLabelText("Funcionalidades (uma por linha)") as HTMLTextAreaElement).value).toBe("Pedidos\nEquipe");
  fireEvent.change(screen.getByLabelText("Preço mensal"), { target: { value: "1" } });
  data.plans.mockResolvedValue([{ ...plan, monthlyPrice: 120, updatedAt: new Date("2026-10-01T11:00:00Z") }]);
  view.rerender(await PlatformPage());
  expect((screen.getByLabelText("Preço mensal") as HTMLInputElement).value).toBe("120");
});
it("refreshes profile fields when persisted user data changes", async () => {
  data.profile.mockResolvedValue({ name: "Nome salvo", email: "test@example.invalid", phone: "11999990000", cpf: null });
  const view = render(await ProfilePage());
  fireEvent.change(screen.getByDisplayValue("Nome salvo"), { target: { value: "Rascunho" } });
  data.profile.mockResolvedValue({ name: "Nome atualizado", email: "test@example.invalid", phone: "11888880000", cpf: null });
  view.rerender(await ProfilePage());
  expect(screen.getByDisplayValue("Nome atualizado")).toBeDefined();
  expect(screen.getByDisplayValue("11888880000")).toBeDefined();
});
