import { apiRequest } from '../../../shared/api/apiClient'
import type { AuditLog, PageResponse, Permission, Role, UserAccess } from '../types/access'

export const accessControlApi = {
  users(search: string) {
    const query = new URLSearchParams({ size: '20', sort: 'createdAt,desc' })
    if (search.trim()) {
      query.set('search', search.trim())
    }
    return apiRequest<PageResponse<UserAccess>>(`/access-control/users?${query.toString()}`)
  },
  roles() {
    return apiRequest<Role[]>('/access-control/roles')
  },
  permissions() {
    return apiRequest<Permission[]>('/access-control/permissions')
  },
  updateRoles(userId: string, roles: string[]) {
    return apiRequest<UserAccess>(`/access-control/users/${userId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ roles }),
    })
  },
  updateStatus(userId: string, enabled: boolean, accountNonLocked: boolean) {
    return apiRequest<UserAccess>(`/access-control/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled, accountNonLocked }),
    })
  },
  resetPassword(userId: string, temporaryPassword: string) {
    return apiRequest<UserAccess>(`/access-control/users/${userId}/password-reset`, {
      method: 'POST',
      body: JSON.stringify({ temporaryPassword }),
    })
  },
}

export const auditLogApi = {
  list(filters: { user?: string; module?: string; action?: string; from?: string; to?: string }) {
    const query = new URLSearchParams({ size: '30', sort: 'createdAt,desc' })
    Object.entries(filters).forEach(([key, value]) => {
      if (value?.trim()) {
        query.set(key, value.trim())
      }
    })
    return apiRequest<PageResponse<AuditLog>>(`/audit-logs?${query.toString()}`)
  },
}
