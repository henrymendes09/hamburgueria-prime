"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/lib/validations";
import { registerAction } from "@/actions/auth";
import { formatPhone } from "@/lib/utils";
import { z } from "zod";

type FormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(registerSchema) });
  const phone = useWatch({ control, name: "phone" });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const result = await registerAction(data);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormData, { message });
        }
      }
      toast.error(result.message);
      setIsLoading(false);
      return;
    }

    toast.success(result.message);

    const loginResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setIsLoading(false);

    if (loginResult?.ok) {
      router.push("/");
      router.refresh();
    } else {
      router.push("/login");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-flame mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-flame mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={phone ?? ""}
          onChange={(e) => setValue("phone", formatPhone(e.target.value))}
          placeholder="(11) 99999-9999"
        />
        {errors.phone && <p className="text-xs text-flame mt-1">{errors.phone.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-xs text-flame mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-xs text-flame mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-ash">
        Já tem conta?{" "}
        <Link href="/login" className="font-bold text-flame">
          Fazer login
        </Link>
      </p>
    </form>
  );
}
