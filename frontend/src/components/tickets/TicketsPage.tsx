import { useState } from "react";
import { useTickets } from "@/api/tickets.api";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { TicketTable } from "@/components/dashboard/TicketTable";

const PAGE_SIZE = 10;

export function TicketsPage() {
  const tickets = useTickets();
  const [page, setPage] = useState(0);

  const allTickets = tickets.data ?? [];
  const totalPages = Math.ceil(allTickets.length / PAGE_SIZE);
  const paginatedTickets = allTickets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="p-6">
      <Card className="w-full">
        <Card.Header>
          <Card.Title>All Tickets</Card.Title>
        </Card.Header>
        <Card.Content>
          {tickets.isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : allTickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tickets yet</p>
          ) : (
            <>
              <TicketTable tickets={paginatedTickets} />
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
