export type QueueStatus = 'WAITING' | 'CALLED' | 'SKIPPED' | 'COMPLETED' | 'CANCELLED'

export type QueueTicket = {
  id: string
  queueDate: string
  queueNumber: number
  queueCode: string
  patientId: string
  patientCode: string
  patientName: string
  appointmentId: string | null
  assignedStaffId: string | null
  assignedStaffName: string | null
  status: QueueStatus
  priority: number
  notes: string | null
  checkedInAt: string
  calledAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type QueueCheckInPayload = {
  patientId: string
  appointmentId?: string
  assignedStaffId?: string
  priority?: number
  notes?: string
}

export type QueueStatusPayload = {
  status: QueueStatus
  assignedStaffId?: string
  notes?: string
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
