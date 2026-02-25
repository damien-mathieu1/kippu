import { Dialog } from "@/components/retroui/Dialog";
import { Badge } from "@/components/retroui/Badge";
import type { Ticket } from "@/types";

const feedbackVariant: Record<string, "default" | "outline" | "solid" | "surface"> = {
  bug: "solid",
  positive: "surface",
  feature: "outline",
};

interface TicketDetailProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketDetail({ ticket, onClose }: TicketDetailProps) {
  return (
    <Dialog open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content size="md">
        <Dialog.Header>{ticket?.subject ?? "Ticket"}</Dialog.Header>
        {ticket && (
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={feedbackVariant[ticket.feedbackType] ?? "default"}>
                {ticket.feedbackType}
              </Badge>
              <Badge variant="outline">{ticket.label}</Badge>
              <Badge variant="default">{ticket.channel}</Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact</p>
              <p>{ticket.contact}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Content</p>
              <p className="whitespace-pre-wrap">{ticket.content}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p>
                {ticket.timestamp.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                {ticket.timestamp.toLocaleTimeString("fr-FR")}
              </p>
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
