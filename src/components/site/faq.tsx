"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Qual o tempo médio de entrega?",
    a: "Nosso tempo médio é de 35 a 50 minutos, dependendo da sua região e do movimento do dia.",
  },
  {
    q: "Vocês entregam em toda a cidade?",
    a: "Entregamos em um raio de 8km da loja. Ao inserir seu CEP no checkout, você verá se sua região está coberta.",
  },
  {
    q: "Posso agendar meu pedido?",
    a: "Sim! No checkout, escolha a opção de entrega agendada e selecione o melhor dia e horário para você.",
  },
  {
    q: "Quais formas de pagamento vocês aceitam?",
    a: "Aceitamos Pix, cartão de crédito/débito e dinheiro (com opção de troco).",
  },
  {
    q: "Como funciona a política de cancelamento?",
    a: "Pedidos podem ser cancelados gratuitamente enquanto estiverem com status 'Recebido'. Após aceito pela cozinha, entre em contato pelo WhatsApp.",
  },
];

export function FAQ() {
  return (
    <div className="mt-16">
      <h2 className="font-display text-3xl text-ink text-center mb-8">Perguntas frequentes</h2>
      <AccordionPrimitive.Root type="single" collapsible className="max-w-2xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, i) => (
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
