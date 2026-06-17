import { apiRequest } from '../../../shared/api/apiClient'
import type { PageResponse, QueueCheckInPayload, QueueStatus, QueueStatusPayload, QueueTicket } from '../types/queue'

type QueueFilters = {
  search?: string
  status?: QueueStatus | ''
  date?: string
}

function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== undefined),
  )
}

export const queueApi = {
  list(filters: QueueFilters = {}) {
    const query = new URLSearchParams({ size: '60', sort: 'checkedInAt,asc' })
    if (filters.search?.trim()) query.set('search', filters.search.trim())
    if (filters.status) query.set('status', filters.status)
    if (filters.date) query.set('date', filters.date)
    return apiRequest<PageResponse<QueueTicket>>(`/queue?${query.toString()}`)
  },
  checkIn(payload: QueueCheckInPayload) {
    return apiRequest<QueueTicket>('/queue/check-in', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  updateStatus(id: string, payload: QueueStatusPayload) {
    return apiRequest<QueueTicket>(`/queue/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
}
