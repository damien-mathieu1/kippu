import { Card } from "@/components/retroui/Card";
import { BarChart } from "@/components/retroui/charts/BarChart";
import { useDlqKpis } from "@/api/tickets.api";

export function DlqKpiCard() {
    const { data: kpis, isLoading, error } = useDlqKpis();

    const chartData =
        kpis?.map((kpi) => ({
            source: kpi.sourceTopic,
            count: kpi.count,
        })) ?? [];

    const total = kpis?.reduce((sum, kpi) => sum + kpi.count, 0) ?? 0;

    return (
        <Card className="w-full">
            <Card.Header>
                <Card.Title>DLQ Metrics (Errors by Source)</Card.Title>
            </Card.Header>
            <Card.Content>
                {isLoading ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                        Loading...
                    </div>
                ) : error ? (
                    <div className="h-40 flex items-center justify-center text-destructive">
                        Failed to load DLQ KPIs
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <div className="flex-1 min-w-0">
                            {chartData.length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-muted-foreground">No errors</div>
                            ) : (
                                <BarChart
                                    className="h-40"
                                    data={chartData}
                                    index="source"
                                    categories={["count"]}
                                    fillColors={["#ffdb33"]}
                                    strokeColors={["var(--foreground)"]}
                                    showGrid={false}
                                    showTooltip={true}
                                />
                            )}
                        </div>
                        <div className="grid gap-4 shrink-0">
                            <div className="text-center">
                                <span className="font-head text-4xl">{total}</span>
                                <p className="text-sm text-muted-foreground mt-1">total errors</p>
                            </div>
                        </div>
                    </div>
                )}
            </Card.Content>
        </Card>
    );
}
