import { Card } from "@/components/retroui/Card";
import { KpiChart } from "./KpiChart";
import { mockKpis, computeKpiPercentages } from "@/data/mock-kpis";

export function KpiCard() {
  const percentages = computeKpiPercentages(mockKpis);
  const positive = percentages.find((p) => p.feedbackType === "positive");

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>KPIs</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <KpiChart />
          </div>
          <div className="text-center shrink-0">
            <span className="font-head text-6xl">{positive?.percentage ?? 0}%</span>
            <p className="text-sm text-muted-foreground mt-1">positive</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
