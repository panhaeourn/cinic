import { apiRequest } from '../../../shared/api/apiClient'
import type { ReportSummary } from '../types/reports'

export const reportsApi = {
  summary(from?: string, to?: string) {
    const query = new URLSearchParams()
    if (from) {
      query.set('from', from)
    }
    if (to) {
      query.set('to', to)
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<ReportSummary>(`/reports/summary${suffix}`)
  },
}
