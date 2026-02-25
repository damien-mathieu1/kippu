import type { Ticket, TicketKpi, DLQKpi, TimeSeriesKpi } from "@/types";

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

export async function fetchDlqKpis(): Promise<DLQKpi[]> {
  const res = await fetch(`${API_URL}/dlq/count`);
  if (!res.ok) throw new Error(`Failed to fetch DLQ KPIs: ${res.status}`);
  return res.json();
}

export async function fetchKpisTimeSeries(): Promise<TimeSeriesKpi[]> {
  const res = await fetch(`${API_URL}/kpis/timeseries`);
  if (!res.ok) throw new Error(`Failed to fetch time-series KPIs: ${res.status}`);
  return res.json();
}

export async function fetchDlqTimeSeries(): Promise<TimeSeriesKpi[]> {
  const res = await fetch(`${API_URL}/dlq/timeseries`);
  if (!res.ok) throw new Error(`Failed to fetch DLQ time-series: ${res.status}`);
  return res.json();
}
