import { Card } from "@/components/retroui/Card";
import { BarChart } from "@/components/retroui/charts/BarChart";
import { useDlqTimeSeries } from "@/api/tickets.api";
import { useMemo } from "react";

export function DlqTimeSeriesChart() {
    const { data: timeseries, isLoading, error } = useDlqTimeSeries();

    const chartData = useMemo(() => {
        if (!timeseries || timeseries.length === 0) return [];

        const sortedTimeseries = [...timeseries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const intervalMs = 5 * 60 * 1000; // 5 minutes

        const firstBin = new Date(sortedTimeseries[0].date).getTime();
        const currentBin = Math.floor(Date.now() / intervalMs) * intervalMs;

        const dataMap = new Map(sortedTimeseries.map((t) => [new Date(t.date).getTime(), t.count]));

        const paddedData = [];

        // Loop forward from the very first bin to the current time bin
        for (let time = firstBin; time <= currentBin; time += intervalMs) {
            paddedData.push({
                time: new Date(time).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                errors: dataMap.get(time) || 0,
            });
        }

        return paddedData;
    }, [timeseries]);

    return (
        <Card className="w-full">
            <Card.Header>
                <Card.Title>DLQ Errors Over Time (5-min intervals)</Card.Title>
            </Card.Header>
            <Card.Content>
                {isLoading ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                        Loading...
                    </div>
                ) : error ? (
                    <div className="h-40 flex items-center justify-center text-destructive">
                        Failed to load DLQ time-series data
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                        No data available
                    </div>
                ) : (
                    <BarChart
                        className="h-64"
                        data={chartData}
                        index="time"
                        categories={["errors"]}
                        fillColors={["#ff3333"]}
                        strokeColors={["var(--foreground)"]}
                        showGrid={true}
                        showTooltip={true}
                    />
                )}
            </Card.Content>
        </Card>
    );
}
