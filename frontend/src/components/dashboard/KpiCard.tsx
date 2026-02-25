import { Card } from "@/components/retroui/Card";
import { KpiChart } from "./KpiChart";
import { KpiBarChart } from "./KpiBarChart";
import { computeKpiPercentages } from "@/data/mock-kpis";
import type { TicketKpi } from "@/types";

interface KpiCardProps {
  kpis: TicketKpi[] | null;
}

export function KpiCard({ kpis }: KpiCardProps) {
  const percentages = kpis ? computeKpiPercentages(kpis) : [];
  const total = kpis?.reduce((sum, kpi) => sum + kpi.count, 0) ?? 0;
  const positive = percentages.find((p) => p.feedbackType === "positive");
  const bug = percentages.find((p) => p.feedbackType === "bug");
  const feature = percentages.find((p) => p.feedbackType === "feature");

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>KPIs</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <KpiChart kpis={kpis} />
          </div>
          <div className="flex-1 min-w-0">
            <KpiBarChart kpis={kpis} />
          </div>
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="text-center">
              <span className="font-head text-4xl">{total}</span>
              <p className="text-sm text-muted-foreground mt-1">total</p>
            </div>
            <div className="text-center">
              <span className="font-head text-4xl">{positive?.percentage ?? 0}%</span>
              <p className="text-sm text-muted-foreground mt-1">positive</p>
            </div>
            <div className="text-center">
              <span className="font-head text-4xl">{bug?.percentage ?? 0}%</span>
              <p className="text-sm text-muted-foreground mt-1">bug</p>
            </div>
            <div className="text-center">
              <span className="font-head text-4xl">{feature?.percentage ?? 0}%</span>
              <p className="text-sm text-muted-foreground mt-1">feature</p>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
