"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
export function FAQ({ items, title }: { items: { q: string; a: string }[]; title: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-16">
      <h2 className="font-display text-3xl text-ink text-center mb-8">{title}</h2>
      <AccordionPrimitive.Root type="single" collapsible className="max-w-2xl mx-auto space-y-3">
        {items.map((item, i) => (
          <AccordionPrimitive.Item
            key={i}
            value={`item-${i}`}
            className="rounded-2xl border-2 border-ink/5 overflow-hidden"
          >
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between p-5 text-left font-bold text-ink normal-case">
                {item.q}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="overflow-hidden px-5 pb-5 text-sm text-ash normal-case data-[state=open]:animate-in data-[state=closed]:animate-out">
              {item.a}
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
}
