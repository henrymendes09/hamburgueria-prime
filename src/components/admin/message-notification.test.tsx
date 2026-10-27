// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MessageNotification } from "./message-notification";
let summary = { unread: 1, latestId: "first" };
beforeEach(() => {
  sessionStorage.clear(); summary = { unread: 1, latestId: "first" };
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => summary })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("keeps dismissed notices closed across navigation but not for new messages", async () => {
  const view = render(<MessageNotification accountKey="restaurant:admin" />);
  await screen.findByRole("status");
  fireEvent.click(screen.getByRole("button", { name: "Fechar aviso de mensagens" }));
  expect(screen.queryByRole("status")).toBeNull();
  view.unmount();
  render(<MessageNotification accountKey="restaurant:admin" />);
  await act(async () => {});
  expect(screen.queryByRole("status")).toBeNull();
  summary = { unread: 2, latestId: "second" };
  await act(async () => { window.dispatchEvent(new Event("hp-messages-updated")); });
  await screen.findByText("Você tem 2 mensagens não lidas");
  summary = { unread: 0, latestId: "" };
  await act(async () => { window.dispatchEvent(new Event("hp-messages-updated")); });
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
});
