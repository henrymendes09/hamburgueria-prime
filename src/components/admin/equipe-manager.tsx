"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, ShieldCheck, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createStaffAction } from "@/actions/customers";

type Staff = { id: string; name: string; email: string; role: string };

export function EquipeManager({ staff: initial }: { staff: Staff[] }) {
  const [staff, setStaff] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" as "ADMIN" | "ENTREGADOR" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createStaffAction(form);
    setIsSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      setStaff((prev) => [...prev, { id: crypto.randomUUID(), name: form.name, email: form.email, role: form.role }]);
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Equipe</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar membro
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-white border-2 border-ink/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5">
              {member.role === "ADMIN" ? <ShieldCheck className="h-5 w-5 text-flame" /> : <Bike className="h-5 w-5 text-flame" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-ink truncate">{member.name}</p>
              <p className="text-xs text-ash-light truncate">{member.email}</p>
            </div>
            <Badge variant={member.role === "ADMIN" ? "dark" : "outline"}>
              {member.role === "ADMIN" ? "Admin" : "Entregador"}
            </Badge>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membro da equipe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div>
              <Label>Função</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v as typeof p.role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="ENTREGADOR">Entregador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <Label>Senha provisória</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} minLength={6} required />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Criando..." : "Criar acesso"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
