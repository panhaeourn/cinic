import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from './AuthContext'

type RoleRouteProps = {
  allowedRoles: string[]
  children: ReactNode
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user } = useAuth()
  const canAccess = user?.roles.some((role) => allowedRoles.includes(role)) ?? false

  if (!canAccess) {
    return <Navigate replace to={user?.roles.includes('PATIENT') ? '/app/patient' : '/app'} />
  }

  return children
}
