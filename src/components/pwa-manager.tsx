"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed") === "1";
    if (!standalone && !wasDismissed) {
      queueMicrotask(() => {
        setDismissed(false);
        setShowIosHelp(ios);
      });
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      if (!wasDismissed) setDismissed(false);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  if (dismissed || (!installPrompt && !showIosHelp)) return null;

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setDismissed(true);
    setInstallPrompt(null);
  }

  function dismiss() {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  }

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-ink p-4 text-paper shadow-2xl ring-1 ring-white/10">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-flame"><Download className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1 normal-case">
        <p className="font-bold">Instalar aplicativo</p>
        <p className="text-xs text-paper/60">{showIosHelp ? "No iPhone, toque em Compartilhar e depois em “Adicionar à Tela de Início”." : "Acesse pedidos, painel e entregas pela tela inicial."}</p>
      </div>
      {!showIosHelp && <button onClick={install} className="rounded-lg bg-flame px-4 py-2 text-sm font-bold text-white">Instalar</button>}
      <button onClick={dismiss} aria-label="Fechar" className="rounded-full p-1 text-paper/50 hover:text-paper"><X className="h-4 w-4" /></button>
    </aside>
  );
}
