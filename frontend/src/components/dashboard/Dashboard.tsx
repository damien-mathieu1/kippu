import { useTickets, useKpis } from "@/api/tickets.api";
import { KpiCard } from "./KpiCard";
import { TicketSupportCard } from "./TicketSupportCard";
import { TicketTimeSeriesChart } from "./TicketTimeSeriesChart";
import { DlqTimeSeriesChart } from "./DlqTimeSeriesChart";
import { DlqKpiCard } from "./DlqKpiCard";

const POLL_INTERVAL = 10_000;

export function Dashboard() {
  const tickets = useTickets();
  const kpis = useKpis();

  const lastUpdated =
    tickets.dataUpdatedAt ? new Date(tickets.dataUpdatedAt)
      : kpis.dataUpdatedAt ? new Date(kpis.dataUpdatedAt)
        : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-end gap-2 mb-4 text-sm text-muted-foreground">
        {tickets.isLoading || kpis.isLoading ? (
          <span>Loading...</span>
        ) : tickets.error && kpis.error ? (
          <span className="text-destructive">Connection error — retrying...</span>
        ) : (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>
              Live — refreshing every {POLL_INTERVAL / 1000}s
              {lastUpdated && (
                <> · last update {lastUpdated.toLocaleTimeString("fr-FR")}</>
              )}
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-6">
        <KpiCard kpis={kpis.data ?? null} />

        <TicketTimeSeriesChart />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DlqKpiCard />
          <DlqTimeSeriesChart />
        </div>

        <TicketSupportCard tickets={tickets.data ?? null} />
      </div>
    </div>
  );
}
