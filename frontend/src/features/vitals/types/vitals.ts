export type Vitals = {
  id: string
  patientId: string
  patientCode: string
  patientName: string
  queueTicketId: string | null
  queueCode: string | null
  encounterId: string | null
  nurseId: string | null
  nurseName: string | null
  systolicBp: number | null
  diastolicBp: number | null
  temperatureC: number | null
  oxygenSaturation: number | null
  heartRate: number | null
  weightKg: number | null
  heightCm: number | null
  notes: string | null
  recordedAt: string
  createdAt: string
  updatedAt: string
}

export type VitalsPayload = {
  patientId: string
  queueTicketId?: string
  encounterId?: string
  nurseId?: string
  systolicBp?: number
  diastolicBp?: number
  temperatureC?: number
  oxygenSaturation?: number
  heartRate?: number
  weightKg?: number
  heightCm?: number
  notes?: string
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
