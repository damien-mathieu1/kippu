import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { TicketTable } from "./TicketTable";
import { Link } from "react-router-dom";
import type { Ticket } from "@/types";

const DEFAULT_COUNT = 5;

interface TicketSupportCardProps {
  tickets: Ticket[] | null;
}

export function TicketSupportCard({ tickets }: TicketSupportCardProps) {
  const allTickets = tickets ?? [];
  const visibleTickets = allTickets.slice(0, DEFAULT_COUNT);

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>Ticket Support</Card.Title>
      </Card.Header>
      <Card.Content>
        {allTickets.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No tickets yet</p>
        ) : (
          <>
            <TicketTable tickets={visibleTickets} />
            {allTickets.length > DEFAULT_COUNT && (
              <div className="flex justify-center mt-4">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/tickets">Voir plus</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}
