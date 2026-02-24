import { useState } from "react";
import { Card } from "@/components/retroui/Card";
import { TicketTable } from "./TicketTable";
import { Pagination } from "./Pagination";
import { mockTickets } from "@/data/mock-tickets";

const PAGE_SIZE = 5;

export function TicketSupportCard() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(mockTickets.length / PAGE_SIZE);
  const paginatedTickets = mockTickets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>Ticket Support</Card.Title>
      </Card.Header>
      <Card.Content>
        <TicketTable tickets={paginatedTickets} />
        <Pagination total={totalPages} current={page} onPageChange={setPage} />
      </Card.Content>
    </Card>
  );
}
