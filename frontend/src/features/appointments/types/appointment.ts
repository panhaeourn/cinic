export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export type Appointment = {
  id: string
  patientId: string
  patientCode: string
  patientName: string
  doctorId: string | null
  doctorName: string | null
  scheduledAt: string
  durationMinutes: number
  status: AppointmentStatus
  reason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type AppointmentPayload = {
  patientId: string
  doctorId?: string
  scheduledAt: string
  durationMinutes?: number
  reason?: string
  notes?: string
}

export type AppointmentStatusPayload = {
  status: AppointmentStatus
  notes?: string
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
