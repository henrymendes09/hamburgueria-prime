"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils";

export type DriverDeliverySummary = {
  name: string;
  weekDeliveries: number;
  weekPayout: number;
  monthDeliveries: number;
  monthPayout: number;
};

export function DeliveryDriversChart({ data }: { data: DriverDeliverySummary[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm normal-case text-ash">Nenhum entregador cadastrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0e0d0c0d" />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="deliveries" allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} width={32} />
            <YAxis yAxisId="payout" orientation="right" fontSize={11} tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `R$${value}`} />
            <Tooltip
              formatter={(value, key) => key === "Repasse no mês" ? formatMoney(Number(value)) : Number(value)}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            />
            <Legend />
            <Bar yAxisId="deliveries" dataKey="monthDeliveries" name="Entregas no mês" fill="#e01b22" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="payout" dataKey="monthPayout" name="Repasse no mês" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-left text-xs uppercase text-ash-light">
              <th className="pb-2">Entregador</th>
              <th className="pb-2">Entregas na semana</th>
              <th className="pb-2">Repasse na semana</th>
              <th className="pb-2">Entregas no mês</th>
              <th className="pb-2">Repasse no mês</th>
            </tr>
          </thead>
          <tbody>
            {data.map((driver) => (
              <tr key={driver.name} className="border-b border-ink/5 last:border-0">
                <td className="py-3 font-semibold normal-case text-ink">{driver.name}</td>
                <td className="py-3">{driver.weekDeliveries}</td>
                <td className="py-3">{formatMoney(driver.weekPayout)}</td>
                <td className="py-3">{driver.monthDeliveries}</td>
                <td className="py-3 font-semibold text-emerald-700">{formatMoney(driver.monthPayout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs normal-case text-ash-light">Pedidos antigos sem repasse gravado usam a taxa de entrega cobrada como referência.</p>
    </div>
  );
}
