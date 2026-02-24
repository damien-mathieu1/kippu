import { KpiCard } from "./KpiCard";
import { TicketSupportCard } from "./TicketSupportCard";

export function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <KpiCard />
      <TicketSupportCard />
    </div>
  );
}
