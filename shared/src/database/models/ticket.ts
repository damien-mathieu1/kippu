export { TicketLabel, type FeedbackType, type TicketChannel, type FormattedTicket, type LabelizedTicket } from "../../index";

export interface Ticket {
  id: string;
  channel: string;
  contact: string;
  subject?: string;
  content: string;
  feedbackType: string;
  label: string;
  timestamp: Date;
  createdAt?: Date;
}

export interface TicketInput {
  id: string;
  channel: string;
  contact: string;
  subject?: string;
  content: string;
  feedbackType: string;
  label: string;
  timestamp: string | Date;
}
