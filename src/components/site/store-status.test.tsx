// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StoreStatus } from "./store-status";
const open = { open: true, hours: "Quarta, das 12h às 23h.", timeZone: "America/Sao_Paulo", deliveryEstimate: "35 a 50 minutos", message: "Loja aberta" };
const closed = { ...open, open: false, message: "Loja fechada" };
let current = open;
beforeEach(() => { sessionStorage.clear(); current = open; vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => current }))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("does not display a notice or banner while open", async () => {
  render(<StoreStatus initial={open} slug="store" />);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
  expect(screen.queryByRole("dialog")).toBeNull(); expect(screen.queryByRole("status")).toBeNull();
});
it("removes a closed notice when the store opens after a configuration change", async () => {
  current = closed;
  render(<StoreStatus initial={closed} slug="store" />);
  await screen.findByRole("dialog");
  current = open; fireEvent(window, new Event("focus"));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.queryByRole("status")).toBeNull();
});
