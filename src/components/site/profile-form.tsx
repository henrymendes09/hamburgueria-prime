"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPhone, formatCPF } from "@/lib/utils";
import { updateProfileAction } from "@/actions/profile";

export function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [cpf, setCpf] = useState(user.cpf ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateProfileAction({ name, phone, cpf: cpf || undefined });
    setIsSubmitting(false);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome completo</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={user.email} disabled />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
      </div>
      <div>
        <Label>CPF (opcional)</Label>
        <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
