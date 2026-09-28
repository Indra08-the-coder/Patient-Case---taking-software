"use client";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
const COLORS = ["#0F766E", "#1E4277", "#F59E0B", "#DC2626", "#64748B"];
export function DoctorCharts({ byStatus }: { byStatus: { name: string; value: number }[] }) {
  const data = byStatus.length ? byStatus : [{ name: "No data", value: 1 }];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="h-56"><ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" fontSize={10} interval={0} angle={-15} dy={8} height={50} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0F766E" /></BarChart>
      </ResponsiveContainer><p className="text-center text-xs text-[hsl(var(--muted-foreground))]">By status</p></div>
      <div className="h-56"><ResponsiveContainer width="100%" height="100%">
        <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>{data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /></PieChart>
      </ResponsiveContainer><p className="text-center text-xs text-[hsl(var(--muted-foreground))]">Share of workload</p></div>
    </div>
  );
}
