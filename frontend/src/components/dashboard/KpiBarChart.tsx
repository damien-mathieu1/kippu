import { BarChart } from "@/components/retroui/charts/BarChart";
import type { TicketKpi } from "@/types";

interface KpiBarChartProps {
  kpis: TicketKpi[] | null;
}

export function KpiBarChart({ kpis }: KpiBarChartProps) {
  const chartData =
    kpis?.map((kpi) => ({
      name: kpi.feedbackType,
      count: kpi.count,
    })) ?? [];

  return (
    <BarChart
      className="h-40"
      data={chartData}
      index="name"
      categories={["count"]}
      fillColors={["#ffdb33"]}
      strokeColors={["var(--foreground)"]}
      showGrid={false}
      showTooltip={false}
    />
  );
}
