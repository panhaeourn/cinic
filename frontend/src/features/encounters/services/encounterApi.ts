import { apiRequest } from '../../../shared/api/apiClient'
import type { Encounter, EncounterPayload, EncounterStatus, PageResponse } from '../types/encounter'

type EncounterFilters = {
  search?: string
  status?: EncounterStatus | ''
  patientId?: string
}

function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== undefined && value !== null),
  )
}

export const encounterApi = {
  list(filters: EncounterFilters = {}) {
    const query = new URLSearchParams({ size: '40', sort: 'startedAt,desc' })
    if (filters.search?.trim()) query.set('search', filters.search.trim())
    if (filters.status) query.set('status', filters.status)
    if (filters.patientId) query.set('patientId', filters.patientId)
    return apiRequest<PageResponse<Encounter>>(`/encounters?${query.toString()}`)
  },
  create(payload: EncounterPayload) {
    return apiRequest<Encounter>('/encounters', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  complete(id: string, payload: { diagnosis?: string; notes?: string }) {
    return apiRequest<Encounter>(`/encounters/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
}
