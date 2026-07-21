"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginSchema } from "@/lib/validations";
import { z } from "zod";

type FormData = z.infer<typeof loginSchema>;

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const blockedError = searchParams.get("error") === "CONTA_BLOQUEADA";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setIsLoading(false);

    if (result?.error) {
      toast.error(
        result.error === "CONTA_BLOQUEADA"
          ? "Sua conta foi bloqueada. Entre em contato com o suporte."
          : "Email ou senha incorretos."
      );
      return;
    }

    toast.success("Login realizado com sucesso!");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {blockedError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          Sua conta foi bloqueada. Entre em contato com o suporte.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-flame mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/esqueci-senha" className="text-xs font-semibold text-flame">
              Esqueci minha senha
            </Link>
          </div>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-xs text-flame mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-ash-light">
            <div className="h-px flex-1 bg-ink/10" /> ou <div className="h-px flex-1 bg-ink/10" />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <LogIn className="h-4 w-4" /> Entrar com Google
          </Button>
        </>
      )}

      <p className="text-center text-sm text-ash">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-bold text-flame">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
