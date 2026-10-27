// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const save = vi.hoisted(() => vi.fn(async () => ({ success: true, message: "Salvo" })));
vi.mock("@/actions/site-content", () => ({ saveSiteContentAction: save }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/admin/image-uploader", () => ({ ImageUploader: () => <div /> }));
import { SiteContentEditor } from "./site-content-editor";
import { resolveSiteContent } from "@/lib/site-content";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("prefills saved content and persists FAQ edits, additions and deletions", async () => {
  const content = { ...resolveSiteContent({ name: "Loja" }), title: "Nossa loja", body: "Nossa história completa", faqs: [{ q: "Pergunta antiga?", a: "Resposta antiga" }] };
  render(<SiteContentEditor initialValue={content} />);
  expect(screen.getByLabelText("Título da página").getAttribute("value")).toBe("Nossa loja");
  fireEvent.change(screen.getByLabelText("Texto sobre a loja"), { target: { value: "História atualizada" } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar pergunta" }));
  fireEvent.change(screen.getByLabelText("Pergunta 2"), { target: { value: "Nova pergunta?" } });
  fireEvent.change(screen.getByLabelText("Resposta 2"), { target: { value: "Nova resposta" } });
  fireEvent.click(screen.getByRole("button", { name: "Excluir pergunta 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar conteúdo" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith({ ...content, body: "História atualizada", faqs: [{ q: "Nova pergunta?", a: "Nova resposta" }] }));
});
