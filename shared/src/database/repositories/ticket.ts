import { getPool } from "../database";
import type { Ticket, TicketInput } from "../models";

export async function saveTicket(ticket: TicketInput): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO tickets (id, channel, contact, subject, content, feedback_type, label, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      ticket.id,
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

export async function getTicketById(id: string): Promise<Ticket | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, channel, contact, subject, content, feedback_type as "feedbackType", label, timestamp, created_at as "createdAt"
     FROM tickets WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function getAllTickets(limit = 100, offset = 0): Promise<Ticket[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, channel, contact, subject, content, feedback_type as "feedbackType", label, timestamp, created_at as "createdAt"
     FROM tickets ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}
