import { apiRequest } from '../../../shared/api/apiClient'
import type { Department, DepartmentPayload, DepartmentStatus } from '../types/department'

function cleanPayload(payload: DepartmentPayload) {
  return {
    ...payload,
    name: payload.name.trim(),
    description: payload.description.trim(),
  }
}

export const departmentApi = {
  list() {
    return apiRequest<Department[]>('/departments/manage')
  },
  create(payload: DepartmentPayload) {
    return apiRequest<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  update(id: string, payload: DepartmentPayload) {
    return apiRequest<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanPayload(payload)),
    })
  },
  setStatus(id: string, status: DepartmentStatus) {
    return apiRequest<Department>(`/departments/${id}/status?status=${status}`, {
      method: 'PATCH',
    })
  },
}
