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

export interface DLQKpi {
  sourceTopic: string;
  count: number;
}

export interface TimeSeriesKpi {
  date: string;
  count: number;
}
