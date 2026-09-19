import { apiRequest } from '../../../shared/api/apiClient'
import type { Department, PageResponse, Staff, StaffClaim, StaffPayload } from '../types/staff'

function cleanPayload(payload: StaffPayload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  )
}

export const staffApi = {
  list(search: string, signal?: AbortSignal) {
    const query = new URLSearchParams({ size: '20', sort: 'createdAt,desc' })
    if (search.trim()) {
      query.set('search', search.trim())
    }
    return apiRequest<PageResponse<Staff>>(`/staff?${query.toString()}`, { signal })
  },
  create(payload: StaffPayload) {
    return apiRequest<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  update(id: string, payload: StaffPayload) {
    return apiRequest<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  delete(id: string) {
    return apiRequest<void>(`/staff/${id}`, {
      method: 'DELETE',
    })
  },
  departments() {
    return apiRequest<Department[]>('/departments')
  },
  generateClaim(staffId: string) {
    return apiRequest<StaffClaim>('/staff-claims/generate', {
      method: 'POST',
      body: JSON.stringify({ staffId }),
    })
  },
  latestClaim(staffId: string) {
    return apiRequest<StaffClaim | undefined>(`/staff-claims/staff/${staffId}/latest`)
  },
}
