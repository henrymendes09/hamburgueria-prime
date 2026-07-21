"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MenuSearch({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(v: string) {
    setValue(v);
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("busca", v);
    else params.delete("busca");
    startTransition(() => {
      router.push(`/cardapio?${params.toString()}`);
    });
  }

  return (
    <div className="relative mx-auto max-w-md">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-light" />
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar no cardápio..."
        className="pl-11"
      />
    </div>
  );
}
