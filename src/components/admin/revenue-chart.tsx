"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatMoney } from "@/lib/utils";

export function RevenueChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0e0d0c0d" />
        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          formatter={((value: number | string) => formatMoney(Number(value))) as (value: unknown) => string}
          contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
        />
        <Line type="monotone" dataKey="total" stroke="#e01b22" strokeWidth={3} dot={{ fill: "#e01b22", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
