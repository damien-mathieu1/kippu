export type FeedbackType = "bug" | "positive" | "feature";
export type TicketChannel = "whatsapp" | "email";
export enum TicketLabel {
  URGENT = "urgent",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export interface FormattedTicket {
  id: string;
  channel: TicketChannel;
  contact: string;
  subject?: string;
  content: string;
  feedbackType: FeedbackType;
  timestamp: string;
}

export interface LabelizedTicket extends FormattedTicket {
  label: TicketLabel;
}
