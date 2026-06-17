export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export type Permission = {
  id: string
  code: string
  description: string | null
}

export type Role = {
  id: string
  name: string
  description: string | null
  permissions: Permission[]
}

export type UserAccess = {
  id: string
  email: string
  fullName: string
  phoneNumber: string | null
  enabled: boolean
  accountNonLocked: boolean
  credentialsNonExpired: boolean
  roles: string[]
  createdAt: string
  updatedAt: string
}

export type AuditLog = {
  id: string
  actorEmail: string | null
  actorName: string | null
  module: string
  action: string
  entityType: string | null
  entityId: string | null
  details: string
  createdAt: string
}
