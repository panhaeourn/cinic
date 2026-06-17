import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth'
import { authApi } from '../services/authApi'
import { tokenStorage } from '../services/tokenStorage'

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthResponse>
  register: (payload: RegisterPayload) => Promise<AuthResponse>
  completeGoogleLogin: (code: string) => Promise<AuthResponse>
  claimStaffCode: (code: string) => Promise<AuthResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      setIsLoading(false)
      return
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const persistSession = useCallback((response: AuthResponse) => {
    tokenStorage.save(response.accessToken, response.refreshToken)
    setUser(response.user)
    return response
  }, [])

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

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      completeGoogleLogin,
      claimStaffCode,
      logout,
    }),
    [claimStaffCode, completeGoogleLogin, isLoading, login, logout, register, user],
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
