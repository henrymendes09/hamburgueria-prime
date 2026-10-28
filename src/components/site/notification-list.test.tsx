// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/actions/notifications", () => ({ readVisibleOrderNotifications: mocks.read }));
import { NotificationList } from "./notification-list";
const first = { id: "first", orderId: "order", restaurantSlug: "store", title: "Pedido aceito", message: "Seu pedido foi aceito", read: false, createdAt: "2026-10-28T19:00:00Z" };
beforeEach(() => { vi.resetAllMocks(); mocks.read.mockResolvedValue({ success: true, readCount: 1 }); });
afterEach(() => cleanup());
it("automatically marks displayed notifications and handles new notifications while viewing", async () => {
  const event = vi.fn(); window.addEventListener("hp-notifications-read", event);
  const view = render(<NotificationList items={[first]} />);
  await waitFor(() => expect(mocks.read).toHaveBeenCalledWith(["first"]));
  await waitFor(() => expect(event).toHaveBeenCalled());
  view.rerender(<NotificationList items={[first, { ...first, id: "new" }]} />);
  await waitFor(() => expect(mocks.read).toHaveBeenLastCalledWith(["new"]));
  window.removeEventListener("hp-notifications-read", event);
});
it("does not mark read notifications again and provides a retry when saving fails", async () => {
  const view = render(<NotificationList items={[{ ...first, read: true }]} />);
  expect(mocks.read).not.toHaveBeenCalled();
  mocks.read.mockRejectedValue(Error("offline")); view.rerender(<NotificationList items={[first]} />);
  await screen.findByRole("alert"); expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeDefined();
});
