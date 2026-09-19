import { useClinicEvents } from '../../../shared/realtime/useClinicEvents'
import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth'
import { authApi } from '../services/authApi'

const sessionQueryKey = ['auth', 'session'] as const

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthResponse>
  register: (payload: RegisterPayload) => Promise<AuthResponse>
  completeGoogleLogin: (code: string) => Promise<AuthResponse>
  claimStaffCode: (code: string) => Promise<AuthResponse>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient()
	const session = useQuery({
		queryKey: sessionQueryKey,
		queryFn: authApi.me,
		retry: false,
		staleTime: 5 * 60_000,
	})
	const user = session.data ?? null
	useClinicEvents(user?.id)

  const persistSession = useCallback((response: AuthResponse) => {
		queryClient.setQueryData(sessionQueryKey, response.user)
		return response
	}, [queryClient])

  const login = useCallback(
    (payload: LoginPayload) => authApi.login(payload).then(persistSession),
    [persistSession],
  )

  const register = useCallback(
    (payload: RegisterPayload) => authApi.register(payload).then(persistSession),
    [persistSession],
  )

  const completeGoogleLogin = useCallback(
    (code: string) => authApi.exchangeGoogleCode(code).then(persistSession),
    [persistSession],
  )

  const claimStaffCode = useCallback(
    (code: string) => authApi.claimStaffCode(code).then(persistSession),
    [persistSession],
  )

	const logout = useCallback(async () => {
		try {
			await authApi.logout()
		} finally {
			queryClient.setQueryData(sessionQueryKey, null)
			queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
		}
	}, [queryClient])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
		isLoading: session.isPending,
      login,
      register,
      completeGoogleLogin,
      claimStaffCode,
      logout,
    }),
		[claimStaffCode, completeGoogleLogin, login, logout, register, session.isPending, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}
