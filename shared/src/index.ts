export type FeedbackType = "bug" | "positive" | "feature";
export type TicketChannel = "whatsapp" | "email";
export enum TicketLabel {
  P0 = "P0",
  P1 = "P1",
  P2 = "P2",
  P3 = "P3",
}

export enum TicketCategory {
  BUG = "bug",
  FEATURE_REQUEST = "feature_request",
  IMPROVEMENT = "improvement",
  QUESTION = "question",
  OTHER = "other",
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
  category: TicketCategory;
}

export * from "./database";
