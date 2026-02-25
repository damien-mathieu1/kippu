import { getPool } from "../database";
import type { DLQError, DLQErrorInput, DLQErrorFilters, DLQErrorStatus, DLQKpi, TimeSeriesKpi } from "../models";

export async function insertDLQError(error: DLQErrorInput): Promise<number> {
  const pool = getPool();
  const query = `
    INSERT INTO dlq_errors (
      error_id, source_topic, partition, "offset",
      raw_message, error_message, error_stack,
      status, retry_count, error_timestamp, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (error_id) DO UPDATE SET
      retry_count = dlq_errors.retry_count + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `;

  const values = [
    error.errorId,
    error.sourceTopic,
    error.partition,
    error.offset,
    JSON.stringify(error.rawMessage),
    error.errorMessage,
    error.errorStack || null,
    error.status,
    error.retryCount,
    error.errorTimestamp,
    error.metadata ? JSON.stringify(error.metadata) : null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0].id;
}

export async function getDLQErrors(filters?: DLQErrorFilters): Promise<DLQError[]> {
  const pool = getPool();
  let query = `
    SELECT
      id, error_id as "errorId", source_topic as "sourceTopic",
      partition, "offset", raw_message as "rawMessage",
      error_message as "errorMessage", error_stack as "errorStack",
      status, retry_count as "retryCount",
      error_timestamp as "errorTimestamp", created_at as "createdAt",
      updated_at as "updatedAt", resolved_at as "resolvedAt", metadata
    FROM dlq_errors
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    query += ` AND status = $${paramIndex++}`;
    values.push(filters.status);
  }

  if (filters?.sourceTopic) {
    query += ` AND source_topic = $${paramIndex++}`;
    values.push(filters.sourceTopic);
  }

  query += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex++}`;
    values.push(filters.limit);
  }

  if (filters?.offset) {
    query += ` OFFSET $${paramIndex++}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
}

export async function updateDLQErrorStatus(
  errorId: string,
  status: DLQErrorStatus,
): Promise<void> {
  const pool = getPool();
  const query = `
    UPDATE dlq_errors
    SET status = $1,
        resolved_at = CASE WHEN $1 IN ('resolved', 'ignored') THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE error_id = $2
  `;

  await pool.query(query, [status, errorId]);
}

export async function getDLQErrorById(errorId: string): Promise<DLQError | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, error_id as "errorId", source_topic as "sourceTopic",
            partition, "offset", raw_message as "rawMessage",
            error_message as "errorMessage", error_stack as "errorStack",
            status, retry_count as "retryCount",
            error_timestamp as "errorTimestamp", created_at as "createdAt",
            updated_at as "updatedAt", resolved_at as "resolvedAt", metadata
     FROM dlq_errors WHERE error_id = $1`,
    [errorId],
  );
  return result.rows[0] || null;
}

export async function getDLQKpis(): Promise<DLQKpi[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT source_topic as "sourceTopic", count(*) as count 
     FROM dlq_errors 
     GROUP BY source_topic 
     ORDER BY count DESC`
  );
  return result.rows.map(row => ({
    sourceTopic: row.sourceTopic,
    count: parseInt(row.count, 10)
  }));
}

export async function getDLQErrorsOverTime(): Promise<TimeSeriesKpi[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT date_bin('5 minutes', created_at, TIMESTAMP '2020-01-01') as date, COUNT(*) as count 
     FROM dlq_errors 
     GROUP BY date 
     ORDER BY date ASC`
  );
  return result.rows.map(row => ({
    date: new Date(row.date).toISOString(),
    count: parseInt(row.count, 10)
  }));
}
