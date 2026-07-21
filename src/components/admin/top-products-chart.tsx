"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function TopProductsChart({ data }: { data: { name: string; soldCount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0e0d0c0d" horizontal={false} />
        <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis dataKey="name" type="category" fontSize={11} width={110} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
        <Bar dataKey="soldCount" fill="#e01b22" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
