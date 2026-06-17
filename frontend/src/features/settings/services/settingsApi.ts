import { apiRequest } from '../../../shared/api/apiClient'
import type { ClinicSettings, ClinicSettingsPayload } from '../types/settings'

function cleanSettings(payload: ClinicSettingsPayload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  )
}

export const settingsApi = {
  get() {
    return apiRequest<ClinicSettings>('/settings')
  },
  update(payload: ClinicSettingsPayload) {
    return apiRequest<ClinicSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(cleanSettings(payload)),
    })
  },
}
