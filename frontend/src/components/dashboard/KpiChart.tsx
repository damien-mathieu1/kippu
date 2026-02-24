import { AreaChart, Area, ResponsiveContainer, XAxis } from "recharts";
import { mockTimeSeries } from "@/data/mock-kpis";

export function KpiChart() {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={mockTimeSeries}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fontFamily: "Space Grotesk" }}
        />
        <Area
          type="monotone"
          dataKey="tickets"
          stroke="#000"
          strokeWidth={2}
          fill="#ffdb33"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
