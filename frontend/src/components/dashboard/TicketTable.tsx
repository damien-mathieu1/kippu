import { Table } from "@/components/retroui/Table";
import { Badge } from "@/components/retroui/Badge";
import type { Ticket } from "@/types";

const feedbackVariant: Record<string, "default" | "outline" | "solid" | "surface"> = {
  bug: "solid",
  positive: "surface",
  feature: "outline",
};

interface TicketTableProps {
  tickets: Ticket[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>Name</Table.Head>
          <Table.Head>Contact</Table.Head>
          <Table.Head>Date</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {tickets.map((ticket) => (
          <Table.Row key={ticket.id}>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Badge size="sm" variant={feedbackVariant[ticket.feedbackType] ?? "default"}>
                  {ticket.feedbackType}
                </Badge>
                <span className="font-medium">{ticket.subject ?? ticket.content.slice(0, 40)}</span>
              </div>
            </Table.Cell>
            <Table.Cell>{ticket.contact}</Table.Cell>
            <Table.Cell>
              {ticket.timestamp.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
