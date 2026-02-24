export type DLQErrorStatus = "pending" | "processing" | "resolved" | "ignored";

export interface DLQError {
  id?: number;
  errorId: string;
  sourceTopic: string;
  partition: number;
  offset: string;
  rawMessage: Record<string, any>;
  errorMessage: string;
  errorStack?: string;
  status: DLQErrorStatus;
  retryCount: number;
  errorTimestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface DLQErrorInput {
  errorId: string;
  sourceTopic: string;
  partition: number;
  offset: string;
  rawMessage: Record<string, any>;
  errorMessage: string;
  errorStack?: string;
  status: DLQErrorStatus;
  retryCount: number;
  errorTimestamp: Date;
  metadata?: Record<string, any>;
}

export interface DLQErrorFilters {
  status?: DLQErrorStatus;
  sourceTopic?: string;
  limit?: number;
  offset?: number;
}
