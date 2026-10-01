// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
import { PwaManager } from "./pwa-manager";
function prompt() {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.assign(event, { prompt: vi.fn(), userChoice: Promise.resolve({ outcome: "accepted" }) });
  act(() => { window.dispatchEvent(event); });
  return event;
}
beforeEach(() => {
  route.pathname = "/";
  sessionStorage.clear();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("keeps the banner dismissed when the browser emits more installation events", async () => {
  render(<PwaManager />);
  await act(async () => {});
  prompt();
  expect(screen.getByText("Instalar aplicativo")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(sessionStorage.getItem("pwa-install-dismissed")).toBe("1");
  for (let i = 0; i < 3; i++) expect(prompt().defaultPrevented).toBe(true);
  expect(screen.queryByText("Instalar aplicativo")).toBeNull();
});
it("preserves dismissal across remounts and navigation in the same tab", async () => {
  const view = render(<PwaManager />);
  await act(async () => {});
  prompt();
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  route.pathname = "/cardapio";
  view.rerender(<PwaManager />);
  prompt();
  expect(screen.queryByText("Instalar aplicativo")).toBeNull();
  view.unmount();
  render(<PwaManager />);
  await act(async () => {});
  prompt();
  expect(screen.queryByText("Instalar aplicativo")).toBeNull();
});
it.each(["/admin", "/admin/login", "/admin/cardapio", "/admin/pedidos", "/admin/configuracoes", "/super-admin"])("never shows the banner on %s", async pathname => {
  route.pathname = pathname;
  render(<PwaManager />);
  await act(async () => {});
  prompt();
  expect(screen.queryByText("Instalar aplicativo")).toBeNull();
});
it("hides an already visible banner immediately when navigating to admin", async () => {
  const view = render(<PwaManager />);
  await act(async () => {});
  prompt();
  expect(screen.getByText("Instalar aplicativo")).toBeDefined();
  route.pathname = "/admin/cardapio";
  view.rerender(<PwaManager />);
  expect(screen.queryByText("Instalar aplicativo")).toBeNull();
});
it("remembers a successful installation for the session", async () => {
  render(<PwaManager />);
  await act(async () => {});
  prompt();
  fireEvent.click(screen.getByRole("button", { name: "Instalar" }));
  await waitFor(() => expect(sessionStorage.getItem("pwa-install-dismissed")).toBe("1"));
  prompt();
  expect(screen.queryByText("Instalar aplicativo")).toBeNull();
});
it("allows a new browser session to display the banner", async () => {
  sessionStorage.setItem("pwa-install-dismissed", "1");
  const view = render(<PwaManager />);
  await act(async () => {});
  prompt();
  expect(screen.queryByText("Instalar aplicativo")).toBeNull();
  view.unmount(); sessionStorage.clear();
  render(<PwaManager />);
  await act(async () => {});
  prompt();
  expect(screen.getByText("Instalar aplicativo")).toBeDefined();
});
