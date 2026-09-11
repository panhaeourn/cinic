import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth'

export const authApi = {
  login(payload: LoginPayload) {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  register(payload: RegisterPayload) {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  exchangeGoogleCode(code: string) {
    return apiRequest<AuthResponse>('/auth/oauth/google/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },
	me() {
		return apiRequest<User>('/auth/me')
	},
	logout() {
		return apiRequest<void>('/auth/logout', { method: 'POST' })
	},
  claimStaffCode(code: string) {
    return apiRequest<AuthResponse>('/staff-claims/claim', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },
}
