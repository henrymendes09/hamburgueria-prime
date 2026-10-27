// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mock = vi.hoisted(() => ({ signIn: vi.fn(), navigate: vi.fn(), toast: vi.fn(), callback: "/checkout?loja=prime" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams({ callbackUrl: mock.callback }) }));
vi.mock("next-auth/react", () => ({ signIn: mock.signIn }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mock.toast } }));
vi.mock("@/lib/auth-navigation", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/auth-navigation")>(), navigateAfterSignIn: mock.navigate }));
import { LoginForm } from "./login-form";
beforeEach(() => { vi.clearAllMocks(); mock.callback = "/checkout?loja=prime"; mock.signIn.mockResolvedValue({ ok: true, error: null }); });
afterEach(cleanup);
async function submit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "cliente@example.invalid");
  await user.type(screen.getByLabelText("Senha"), "test-password");
  await user.click(screen.getByRole("button", { name: /^Entrar$/ }));
}
it("returns to the interrupted checkout and preserves the signup destination", async () => {
  render(<LoginForm googleEnabled={false} />);
  expect(screen.getByRole("link", { name: "Cadastre-se" }).getAttribute("href")).toBe("/cadastro?callbackUrl=%2Fcheckout%3Floja%3Dprime");
  await submit();
  await waitFor(() => expect(mock.navigate).toHaveBeenCalledWith("/checkout?loja=prime"));
  expect(mock.signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ redirect: false, redirectTo: "/checkout?loja=prime" }));
});
it("does not leave the login page on an unsuccessful authentication", async () => {
  mock.signIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });
  render(<LoginForm googleEnabled={false} />);
  await submit();
  await waitFor(() => expect(mock.toast).toHaveBeenCalled());
  expect(mock.navigate).not.toHaveBeenCalled();
});
