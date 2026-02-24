import { getPool } from "../database";
import type { TicketKpi } from "../models";

export async function updateTicketKpi(feedbackType: string): Promise<void> {
    const pool = getPool();
    await pool.query(
        `INSERT INTO ticket_kpis (feedback_type, count)
     VALUES ($1, 1)
     ON CONFLICT (feedback_type)
     DO UPDATE SET count = ticket_kpis.count + 1`,
        [feedbackType],
    );
}

export async function getTicketKpis(): Promise<TicketKpi[]> {
    const pool = getPool();
    const result = await pool.query(
        `SELECT feedback_type as "feedbackType", count FROM ticket_kpis ORDER BY count DESC`,
    );
    return result.rows;
}
