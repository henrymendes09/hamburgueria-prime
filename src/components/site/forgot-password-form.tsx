"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema } from "@/lib/validations";
import { forgotPasswordAction } from "@/actions/auth";
import { z } from "zod";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [devLink, setDevLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(forgotPasswordSchema) });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await forgotPasswordAction(data);
      if (result.success) {
        toast.success(result.message);
        if (result.devToken) {
          setDevLink(`/redefinir-senha?token=${result.devToken}`);
        }
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-flame mt-1">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar instruções"}
        </Button>
      </form>

      {devLink && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Modo desenvolvimento</p>
          <p className="mb-2">
            Nenhum provedor de email (SMTP/Resend/SendGrid) está configurado neste projeto, então o
            link de redefinição é exibido aqui para você testar. Em produção, ele seria enviado por
            email.
          </p>
          <Link href={devLink} className="font-bold underline">
            Abrir link de redefinição
          </Link>
        </div>
      )}

      <p className="text-center text-sm text-ash">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-bold text-flame">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
