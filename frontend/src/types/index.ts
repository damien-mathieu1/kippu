export interface Ticket {
  id: string;
  channel: string;
  contact: string;
  subject?: string;
  content: string;
  feedbackType: string;
  label: string;
  timestamp: Date;
}

export interface TicketKpi {
  feedbackType: string;
  count: number;
}
