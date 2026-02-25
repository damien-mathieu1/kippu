import type { Ticket, TicketKpi } from "@/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchTickets(limit = 100, offset = 0): Promise<Ticket[]> {
  const res = await fetch(`${API_URL}/tickets?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to fetch tickets: ${res.status}`);
  const data = await res.json();
  return data.map((t: Record<string, unknown>) => ({
    ...t,
    timestamp: new Date(t.timestamp as string),
  }));
}

export async function fetchKpis(): Promise<TicketKpi[]> {
  const res = await fetch(`${API_URL}/kpis`);
  if (!res.ok) throw new Error(`Failed to fetch KPIs: ${res.status}`);
  return res.json();
}
