"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { sendContactMessageAction } from "@/actions/contact";

const schema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Informe o assunto"),
  message: z.string().min(10, "Escreva uma mensagem com mais detalhes"),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await sendContactMessageAction(data);
      if (result.success) {
        toast.success(result.message);
        reset();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border-2 border-ink/5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-flame mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-flame mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="subject">Assunto</Label>
          <Input id="subject" {...register("subject")} />
          {errors.subject && <p className="text-xs text-flame mt-1">{errors.subject.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="message">Mensagem</Label>
        <Textarea id="message" rows={5} {...register("message")} />
        {errors.message && <p className="text-xs text-flame mt-1">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
