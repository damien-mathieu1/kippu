export type FeedbackType = "bug" | "positive" | "feature";
export type TicketChannel = "whatsapp" | "email";

export interface FormattedTicket {
  id: string;
  channel: TicketChannel;
  contact: string;
  subject?: string;
  content: string;
  feedbackType: FeedbackType;
  timestamp: string;
}
