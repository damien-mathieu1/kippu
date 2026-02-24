import { Pool, PoolClient } from "pg";

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "messages",
  user: process.env.POSTGRES_USER || "app",
  password: process.env.POSTGRES_PASSWORD || "app",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export interface DLQError {
  id?: number;
  errorId: string;
  sourceTopic: string;
  partition: number;
  offset: string;
  rawMessage: Record<string, any>;
  errorMessage: string;
  errorStack?: string;
  status: "pending" | "processing" | "resolved" | "ignored";
  retryCount: number;
  errorTimestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export async function initDatabase(): Promise<void> {
  // Ne pas créer automatiquement le schéma si AUTO_MIGRATE=false
  if (process.env.AUTO_MIGRATE === "false") {
    console.log("⏭ Migration automatique désactivée (AUTO_MIGRATE=false)");
    return;
  }

  const client = await pool.connect();
  try {
    const fs = require("fs");
    const path = require("path");
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await client.query(schema);
    console.log("✓ Base de données initialisée automatiquement");
    console.log(
      "💡 Conseil: Utilisez 'pnpm migrate' pour les migrations manuelles",
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation de la base de données:",
      error,
    );
    throw error;
  } finally {
    client.release();
  }
}

export async function insertDLQError(
  error: Omit<DLQError, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const query = `
    INSERT INTO dlq_errors (
      error_id, source_topic, partition, offset,
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

  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error("Erreur lors de l'insertion de l'erreur DLQ:", error);
    throw error;
  }
}

export async function getDLQErrors(filters?: {
  status?: string;
  sourceTopic?: string;
  limit?: number;
  offset?: number;
}): Promise<DLQError[]> {
  let query = `
    SELECT
      id, error_id as "errorId", source_topic as "sourceTopic",
      partition, offset, raw_message as "rawMessage",
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

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Erreur lors de la récupération des erreurs DLQ:", error);
    throw error;
  }
}

export async function updateDLQErrorStatus(
  errorId: string,
  status: "pending" | "processing" | "resolved" | "ignored",
): Promise<void> {
  const query = `
    UPDATE dlq_errors
    SET status = $1,
        resolved_at = CASE WHEN $1 IN ('resolved', 'ignored') THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE error_id = $2
  `;

  try {
    await pool.query(query, [status, errorId]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}

export { pool };
