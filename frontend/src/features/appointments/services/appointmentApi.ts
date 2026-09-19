import { apiRequest } from '../../../shared/api/apiClient'
import type { Appointment, AppointmentPayload, AppointmentStatus, AppointmentStatusPayload, PageResponse } from '../types/appointment'

type AppointmentFilters = {
  search?: string
  status?: AppointmentStatus | ''
  from?: string
  to?: string
}

function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== undefined),
  )
}

export const appointmentApi = {
  list(filters: AppointmentFilters = {}, signal?: AbortSignal) {
    const query = new URLSearchParams({ size: '40', sort: 'scheduledAt,asc' })
    if (filters.search?.trim()) query.set('search', filters.search.trim())
    if (filters.status) query.set('status', filters.status)
    if (filters.from) query.set('from', filters.from)
    if (filters.to) query.set('to', filters.to)
    return apiRequest<PageResponse<Appointment>>(`/appointments?${query.toString()}`, { signal })
  },
  create(payload: AppointmentPayload) {
    return apiRequest<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  updateStatus(id: string, payload: AppointmentStatusPayload) {
    return apiRequest<Appointment>(`/appointments/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  cancel(id: string, reason?: string) {
    return apiRequest<Appointment>(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(cleanPayload({ reason })),
    })
  },
}
