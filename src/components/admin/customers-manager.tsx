"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Ban, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { toggleCustomerBlockAction } from "@/actions/customers";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  blocked: boolean;
  lastAccess: string;
  ordersCount: number;
  addressesCount: number;
};

export function CustomersManager({ customers: initial }: { customers: Customer[] }) {
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggleBlock(id: string, blocked: boolean) {
    const result = await toggleCustomerBlockAction(id, blocked);
    if (result.success) {
      toast.success(result.message);
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, blocked } : c)));
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-3xl text-ink">Gestão de Clientes</h1>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-light" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-ink/5 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink/5 text-left text-xs uppercase text-ash-light">
              <th className="p-4">Cliente</th>
              <th className="p-4">Contato</th>
              <th className="p-4">Pedidos</th>
              <th className="p-4">Último acesso</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id} className="border-b border-ink/5 last:border-0">
                <td className="p-4 font-semibold text-ink normal-case">{customer.name}</td>
                <td className="p-4 text-ash normal-case">
                  {customer.email}
                  {customer.phone && <div className="text-xs text-ash-light">{customer.phone}</div>}
                </td>
                <td className="p-4">{customer.ordersCount}</td>
                <td className="p-4 text-xs text-ash-light normal-case">{formatDateTime(customer.lastAccess)}</td>
                <td className="p-4">
                  <Badge variant={customer.blocked ? "dark" : "success"}>
                    {customer.blocked ? "Bloqueado" : "Ativo"}
                  </Badge>
                </td>
                <td className="p-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleToggleBlock(customer.id, !customer.blocked)}
                  >
                    {customer.blocked ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" /> Desbloquear
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" /> Bloquear
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
