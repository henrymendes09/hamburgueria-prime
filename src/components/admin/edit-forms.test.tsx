// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const actions = vi.hoisted(() => ({ product: vi.fn(), category: vi.fn(), addon: vi.fn(), coupon: vi.fn(), address: vi.fn(), profile: vi.fn() }));
vi.mock("@/actions/products", () => ({ upsertProductAction: actions.product, upsertCategoryAction: actions.category, upsertAddonAction: actions.addon }));
vi.mock("@/actions/coupon-admin", () => ({ upsertCouponAction: actions.coupon, toggleCouponAction: vi.fn(), deleteCouponAction: vi.fn() }));
vi.mock("@/actions/addresses", () => ({ upsertAddressAction: actions.address, deleteAddressAction: vi.fn() }));
vi.mock("@/actions/profile", () => ({ updateProfileAction: actions.profile }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
import { ProductFormDialog } from "./product-form-dialog";
import { CategoryFormDialog } from "./category-form-dialog";
import { AddonFormDialog } from "./addon-form-dialog";
import { CouponsManager } from "./coupons-manager";
import { AddressManager } from "../site/address-manager";
import { ProfileForm } from "../site/profile-form";
import { RestaurantLogoField } from "./restaurant-logo-field";
const product = { id: "p1", name: "Burger cadastrado", description: "Descrição cadastrada", ingredients: "Carne, Queijo", image: "/images/burger.webp", price: 29.9, promoPrice: 24.9, categoryId: "c1", available: false, featured: true, addonIds: ["a1"] };
const productProps = { open: false, onOpenChange: vi.fn(), categories: [{ id: "c1", name: "Hambúrguer" }], addons: [{ id: "a1", name: "Queijo extra", type: "EXTRA" }] };
afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.clearAllMocks(); for (const action of Object.values(actions)) action.mockResolvedValue({ success: false, message: "Test only" });
});
it("loads every saved product field when a previously closed dialog opens", () => {
  const view = render(<ProductFormDialog {...productProps} />);
  view.rerender(<ProductFormDialog {...productProps} open initialValues={product} />);
  for (const value of [product.name, product.description, product.ingredients, product.image, "29.9", "24.9"]) expect(screen.getByDisplayValue(value)).toBeDefined();
  expect(screen.getByRole("img", { name: "Preview" }).getAttribute("src")).toBe(product.image);
  expect(screen.getByRole("combobox").textContent).toBe("Hambúrguer");
  expect(screen.getAllByRole("checkbox").map(input => input.getAttribute("aria-checked"))).toEqual(["true", "false", "true"]);
});
it("discards cancelled drafts, switches records and resets new-product fields", () => {
  const view = render(<ProductFormDialog {...productProps} open initialValues={product} />);
  fireEvent.change(screen.getByDisplayValue(product.name), { target: { value: "Rascunho" } });
  view.rerender(<ProductFormDialog {...productProps} open initialValues={{ ...product, id: "p2", name: "Segundo produto" }} />);
  expect(screen.getByDisplayValue("Segundo produto")).toBeDefined();
  view.rerender(<ProductFormDialog {...productProps} />);
  view.rerender(<ProductFormDialog {...productProps} open initialValues={product} />);
  expect(screen.getByDisplayValue(product.name)).toBeDefined();
  view.rerender(<ProductFormDialog {...productProps} />);
  view.rerender(<ProductFormDialog {...productProps} open />);
  expect(screen.queryByDisplayValue(product.name)).toBeNull();
  expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
});
it("saves the selected product ID and preserves fields the user did not edit", async () => {
  render(<ProductFormDialog {...productProps} open initialValues={product} />);
  fireEvent.change(screen.getByDisplayValue(product.name), { target: { value: "Nome alterado" } });
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  await waitFor(() => expect(actions.product).toHaveBeenCalledWith("p1", { ...product, name: "Nome alterado" }));
});
it("prefills category name, icon and order and refreshes on record changes", () => {
  const props = { open: false, onOpenChange: vi.fn() };
  const view = render(<CategoryFormDialog {...props} />);
  view.rerender(<CategoryFormDialog {...props} open initialValues={{ id: "c1", name: "Bebidas", icon: "🥤", order: 7 }} />);
  for (const value of ["Bebidas", "🥤", "7"]) expect(screen.getByDisplayValue(value)).toBeDefined();
  view.rerender(<CategoryFormDialog {...props} open initialValues={{ id: "c2", name: "Lanches", icon: "🍔", order: 2 }} />);
  expect(screen.getByDisplayValue("Lanches")).toBeDefined();
  view.rerender(<CategoryFormDialog {...props} />);
  view.rerender(<CategoryFormDialog {...props} open />);
  expect(screen.queryByDisplayValue("Lanches")).toBeNull();
});
it("prefills addon name, price and type and refreshes on record changes", () => {
  const props = { open: false, onOpenChange: vi.fn() };
  const view = render(<AddonFormDialog {...props} />);
  view.rerender(<AddonFormDialog {...props} open initialValues={{ id: "a1", name: "Ao ponto", price: 0, type: "PONTO" }} />);
  expect(screen.getByDisplayValue("Ao ponto")).toBeDefined();
  expect(screen.getByDisplayValue("0")).toBeDefined();
  expect(screen.getByRole("combobox").textContent).toBe("Ponto da carne");
  view.rerender(<AddonFormDialog {...props} open initialValues={{ id: "a2", name: "Bacon", price: 4.5, type: "EXTRA" }} />);
  expect(screen.getByDisplayValue("Bacon")).toBeDefined();
  expect(screen.getByDisplayValue("4.5")).toBeDefined();
  expect(screen.getByRole("combobox").textContent).toBe("Adicional extra (com custo)");
});
it("loads saved coupon restrictions and edits the same coupon preserving its expiry timestamp", async () => {
  const coupon = { id: "coupon1", code: "SALVO", type: "VALOR" as const, value: 7.5, maxUses: 20, usedCount: 3, minOrderValue: 40, expiresAt: "2026-12-31T18:30:00.000Z", active: true, singleUsePerUser: false };
  render(<CouponsManager coupons={[coupon]} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar cupom SALVO" }));
  for (const value of ["SALVO", "7.5", "20", "40", "2026-12-31"]) expect(screen.getByDisplayValue(value)).toBeDefined();
  expect(screen.getByRole("combobox").textContent).toBe("Valor fixo (R$)");
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("false");
  fireEvent.change(screen.getByDisplayValue("7.5"), { target: { value: "8" } });
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  await waitFor(() => expect(actions.coupon).toHaveBeenCalledWith("coupon1", { code: "SALVO", type: "VALOR", value: 8, maxUses: 20, minOrderValue: 40, expiresAt: coupon.expiresAt, singleUsePerUser: false }));
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  fireEvent.click(screen.getByRole("button", { name: "Novo cupom" }));
  expect(screen.queryByDisplayValue("SALVO")).toBeNull();
});
it("loads every address field, saves its ID and clears the editor for a new address", async () => {
  const address = { id: "address1", userId: "user1", label: "Trabalho", cep: "01001-000", street: "Rua cadastrada", number: "123", complement: "Sala 4", neighborhood: "Centro", city: "São Paulo", state: "SP", reference: "Portão azul", isDefault: true, latitude: -23, longitude: -46, createdAt: new Date() };
  render(<AddressManager addresses={[address]} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar endereço Trabalho" }));
  for (const value of [address.label, address.cep, address.street, address.number, address.complement, address.neighborhood, address.city, address.state, address.reference]) expect(screen.getByDisplayValue(value)).toBeDefined();
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
  fireEvent.change(screen.getByDisplayValue("123"), { target: { value: "456" } });
  fireEvent.submit(screen.getByRole("button", { name: "Salvar endereço" }).closest("form")!);
  await waitFor(() => expect(actions.address).toHaveBeenCalledWith("address1", expect.objectContaining({ street: address.street, number: "456", reference: address.reference, isDefault: true })));
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  fireEvent.click(screen.getByRole("button", { name: "Adicionar endereço" }));
  expect(screen.queryByDisplayValue(address.street)).toBeNull();
  expect(screen.getByDisplayValue("Casa")).toBeDefined();
});
it("prefills profile and logo data", () => {
  render(<ProfileForm user={{ name: "Cliente teste", email: "test@example.invalid", phone: "11999990000", cpf: "12345678900" }} />);
  for (const value of ["Cliente teste", "test@example.invalid", "11999990000", "12345678900"]) expect(screen.getByDisplayValue(value)).toBeDefined();
  cleanup();
  render(<RestaurantLogoField initialValue="/logo-salvo.webp" />);
  expect(screen.getByRole("img", { name: "Preview" }).getAttribute("src")).toBe("/logo-salvo.webp");
});
