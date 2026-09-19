import { apiRequest } from '../../../shared/api/apiClient'
import type { CursorPage, PageResponse, Patient, PatientListItem, PatientPayload } from '../types/patient'

function cleanPayload(payload: PatientPayload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  )
}

export const patientApi = {
  list(search: string, signal?: AbortSignal) {
    const query = new URLSearchParams({ size: '20', sort: 'createdAt,desc' })
    if (search.trim()) {
      query.set('search', search.trim())
    }
    return apiRequest<PageResponse<Patient>>(`/patients?${query.toString()}`, { signal })
  },
  listCursor(search: string, cursor: string | null, signal?: AbortSignal) {
    const query = new URLSearchParams({ size: '50' })
    if (search.trim()) {
      query.set('search', search.trim())
    }
    if (cursor) {
      query.set('cursor', cursor)
    }
    return apiRequest<CursorPage<PatientListItem>>(`/patients/cursor?${query.toString()}`, { signal })
  },
  get(id: string) {
    return apiRequest<Patient>(`/patients/${id}`)
  },
  create(payload: PatientPayload) {
    return apiRequest<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  update(id: string, payload: PatientPayload) {
    return apiRequest<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
}
