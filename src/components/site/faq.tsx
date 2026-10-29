"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
export function FAQ({ items, title }: { items: { q: string; a: string }[]; title: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-16">
      <h2 className="mb-8 text-center text-2xl font-bold leading-tight text-ink sm:text-3xl" style={{ fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: "normal" }}>{title}</h2>
      <AccordionPrimitive.Root type="single" collapsible className="max-w-2xl mx-auto space-y-3">
        {items.map((item, i) => (
          <AccordionPrimitive.Item
            key={i}
            value={`item-${i}`}
            className="rounded-2xl border-2 border-ink/5 overflow-hidden"
          >
            <AccordionPrimitive.Header style={{ fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: "normal" }}>
              <AccordionPrimitive.Trigger className="group flex min-h-14 w-full items-center justify-between gap-4 p-5 text-left text-base font-semibold leading-6 text-ink normal-case focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-flame">
                <span className="min-w-0 break-words">{item.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="overflow-hidden whitespace-pre-line break-words px-5 pb-5 text-base leading-relaxed text-ash normal-case data-[state=open]:animate-in data-[state=closed]:animate-out">
              {item.a}
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
}
