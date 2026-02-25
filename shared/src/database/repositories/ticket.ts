import { getPool } from "../database";
import type { Ticket, TicketInput } from "../models";

export async function saveTicket(ticket: TicketInput): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO tickets (id, occurrences_count, channel, contact, subject, content, feedback_type, label, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO NOTHING`,
    [
      ticket.id,
      ticket.occurrencesCount ?? 1,
      ticket.channel,
      ticket.contact,
      ticket.subject ?? null,
      ticket.content,
      ticket.feedbackType,
      ticket.label,
      ticket.timestamp,
    ],
  );
}

export async function incrementTicketOccurrences(id: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE tickets SET occurrences_count = occurrences_count + 1 WHERE id = $1`,
    [id]
  );
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, occurrences_count as "occurrencesCount", channel, contact, subject, content, feedback_type as "feedbackType", label, timestamp, created_at as "createdAt"
     FROM tickets WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function getAllTickets(limit = 100, offset = 0): Promise<Ticket[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, occurrences_count as "occurrencesCount", channel, contact, subject, content, feedback_type as "feedbackType", label, timestamp, created_at as "createdAt"
     FROM tickets ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}

export async function findSimilarTicket(content: string, threshold = 0.75): Promise<Ticket | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, occurrences_count as "occurrencesCount", channel, contact, subject, content, feedback_type as "feedbackType", label, timestamp, created_at as "createdAt"
     FROM tickets
     WHERE similarity(content, $1) > $2
     ORDER BY similarity(content, $1) DESC
     LIMIT 1`,
    [content, threshold]
  );
  return result.rows[0] || null;
}
