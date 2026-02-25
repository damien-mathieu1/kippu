import { AreaChart, Area, ResponsiveContainer, XAxis } from "recharts";
import type { TicketKpi } from "@/types";

interface KpiChartProps {
  kpis: TicketKpi[] | null;
}

export function KpiChart({ kpis }: KpiChartProps) {
  const chartData = kpis?.map((kpi) => ({
    name: kpi.feedbackType,
    count: kpi.count,
  })) ?? [];

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={chartData}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fontFamily: "Space Grotesk" }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#000"
          strokeWidth={2}
          fill="#ffdb33"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
