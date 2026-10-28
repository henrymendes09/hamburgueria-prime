"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

export function LazyStoreMap({ address, name }: { address: string; name: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="h-full w-full bg-ink/5">
    {visible ? <iframe title={`Localização ${name}`} className="h-full w-full" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} /> : <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-ash"><MapPin className="h-6 w-6" /><p>{address}</p><p className="text-xs">Mapa da localização</p></div>}
  </div>;
}
