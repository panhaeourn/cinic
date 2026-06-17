import { apiRequest } from '../../../shared/api/apiClient'
import type { PageResponse, Vitals, VitalsPayload } from '../types/vitals'

function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== undefined && value !== null),
  )
}

export const vitalsApi = {
  list(search = '') {
    const query = new URLSearchParams({ size: '40', sort: 'recordedAt,desc' })
    if (search.trim()) query.set('search', search.trim())
    return apiRequest<PageResponse<Vitals>>(`/vitals?${query.toString()}`)
  },
  create(payload: VitalsPayload) {
    return apiRequest<Vitals>('/vitals', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
}
