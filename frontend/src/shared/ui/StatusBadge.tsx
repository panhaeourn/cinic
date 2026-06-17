import type { ReactNode } from 'react'

type StatusBadgeProps = {
  children: ReactNode
  tone?: 'default' | 'info' | 'success' | 'danger'
}

export function StatusBadge({ children, tone = 'default' }: StatusBadgeProps) {
  return <span className={`status-badge ${tone}`}>{children}</span>
}
