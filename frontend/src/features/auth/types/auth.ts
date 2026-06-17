export type User = {
  id: string
  email: string
  fullName: string
  phoneNumber: string | null
  roles: string[]
  permissions: string[]
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresInSeconds: number
  user: User
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  fullName: string
  email: string
  password: string
  phoneNumber?: string
}
