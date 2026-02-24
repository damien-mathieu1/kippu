import type { TicketKpi } from "@/types";

export const mockKpis: TicketKpi[] = [
  { feedbackType: "positive", count: 45 },
  { feedbackType: "bug", count: 28 },
  { feedbackType: "feature", count: 17 },
];

export function computeKpiPercentages(kpis: TicketKpi[]) {
  const total = kpis.reduce((sum, kpi) => sum + kpi.count, 0);
  return kpis.map((kpi) => ({
    feedbackType: kpi.feedbackType,
    count: kpi.count,
    percentage: total > 0 ? Math.round((kpi.count / total) * 100) : 0,
  }));
}

export const mockTimeSeries = [
  { day: "Lun", tickets: 8 },
  { day: "Mar", tickets: 14 },
  { day: "Mer", tickets: 11 },
  { day: "Jeu", tickets: 18 },
  { day: "Ven", tickets: 15 },
  { day: "Sam", tickets: 6 },
  { day: "Dim", tickets: 4 },
];
