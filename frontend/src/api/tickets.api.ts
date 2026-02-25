import { useQuery } from '@tanstack/react-query'
import { fetchTickets, fetchKpis, fetchDlqKpis, fetchKpisTimeSeries, fetchDlqTimeSeries } from '@/lib/api'

const POLL_INTERVAL = 10_000

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (limit?: number, offset?: number) => [...ticketKeys.all, { limit, offset }] as const,
}

export const kpiKeys = {
  all: ['kpis'] as const,
  dlq: ['dlqKpis'] as const,
  timeseries: ['kpisTimeseries'] as const,
  dlqTimeseries: ['dlqTimeseries'] as const,
}

export function useTickets(limit = 100, offset = 0) {
  return useQuery({
    queryKey: ticketKeys.list(limit, offset),
    queryFn: () => fetchTickets(limit, offset),
    refetchInterval: POLL_INTERVAL,
  })
}

export function useKpis() {
  return useQuery({
    queryKey: kpiKeys.all,
    queryFn: () => fetchKpis(),
    refetchInterval: POLL_INTERVAL,
  })
}

export function useDlqKpis() {
  return useQuery({
    queryKey: kpiKeys.dlq,
    queryFn: () => fetchDlqKpis(),
    refetchInterval: POLL_INTERVAL,
  })
}

export function useKpisTimeSeries() {
  return useQuery({
    queryKey: kpiKeys.timeseries,
    queryFn: () => fetchKpisTimeSeries(),
    refetchInterval: POLL_INTERVAL,
  })
}

export function useDlqTimeSeries() {
  return useQuery({
    queryKey: kpiKeys.dlqTimeseries,
    queryFn: () => fetchDlqTimeSeries(),
    refetchInterval: POLL_INTERVAL,
  })
}
