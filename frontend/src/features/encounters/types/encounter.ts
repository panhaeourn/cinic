export type EncounterStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type Encounter = {
  id: string
  patientId: string
  patientCode: string
  patientName: string
  doctorId: string | null
  doctorName: string | null
  queueTicketId: string | null
  queueCode: string | null
  status: EncounterStatus
  chiefComplaint: string | null
  symptoms: string | null
  diagnosis: string | null
  notes: string | null
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type EncounterPayload = {
  patientId: string
  doctorId?: string
  queueTicketId?: string
  chiefComplaint?: string
  symptoms?: string
  diagnosis?: string
  notes?: string
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
