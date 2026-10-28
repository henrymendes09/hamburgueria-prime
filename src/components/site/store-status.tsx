"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { storeStatus } from "@/lib/store-hours";
type Status = ReturnType<typeof storeStatus>;
export function StoreStatus({
  initial,
  slug,
}: {
  initial: Status;
  slug: string;
}) {
  const [status, setStatus] = useState(initial),
    [notice, setNotice] = useState(false);
  useEffect(() => {
    let active = true,
      busy = false;
    const controller = new AbortController();
    function announce(current: Status) {
      window.dispatchEvent(
        new CustomEvent("hp-store-status", { detail: current }),
      );
      if (!current.open) {
        const key = `hp-store-closed:${slug}:${current.hours}:${current.timeZone}`;
        let seen = false;
        try {
          seen = sessionStorage.getItem(key) === "1";
          sessionStorage.setItem(key, "1");
        } catch {
          /* Sem armazenamento, o aviso permanece nesta visita. */
        }
        if (!seen) setNotice(true);
      } else setNotice(false);
    }
    const initialTimer = window.setTimeout(() => {
      setStatus(initial);
      announce(initial);
      void refresh();
    }, 0);
    async function refresh() {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const response = await fetch(
          `/api/store/status?loja=${encodeURIComponent(slug)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (response.ok && active) {
          const next = await response.json();
          setStatus(next);
          announce(next);
        }
      } catch {
        /* O servidor continua protegendo a finalização. */
      } finally {
        busy = false;
      }
    }
    const timer = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(initialTimer);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [initial, slug]);
  return (
    <>
      {!status.open && (
        <div
          role="status"
          className="border-b bg-amber-50 px-4 py-3 text-center text-sm normal-case text-amber-900"
        >
          <p className="font-bold">Estamos fechados no momento</p>
          <p className="mx-auto mt-1 max-w-4xl whitespace-pre-line text-xs">
            {status.hours}
          </p>
        </div>
      )}
      <Dialog open={!status.open && notice} onOpenChange={setNotice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estamos fechados no momento</DialogTitle>
            <DialogDescription>
              Enquanto isso, fique à vontade para conhecer nosso cardápio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 pb-6 normal-case">
            <p className="whitespace-pre-line text-base leading-relaxed">
              {status.hours}
            </p>
            <Button className="w-full" onClick={() => setNotice(false)}>
              Ver cardápio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
