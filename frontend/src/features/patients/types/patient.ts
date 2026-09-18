export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export type Patient = {
  id: string
  patientCode: string
  userId: string | null
  firstName: string
  lastName: string
  fullName: string
  khmerName: string | null
  gender: Gender
  dateOfBirth: string
  phone: string
  email: string | null
  address: string
  bloodType: string | null
  allergies: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  createdAt: string
  updatedAt: string
}

export type PatientPayload = {
  khmerName?: string
  firstName: string
  lastName: string
  gender: Gender
  dateOfBirth: string
  phone: string
  email?: string
  address: string
  bloodType?: string
  allergies?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export type PatientListItem = Pick<
  Patient,
  'id' | 'patientCode' | 'fullName' | 'khmerName' | 'gender' | 'dateOfBirth' | 'phone' | 'email' | 'bloodType' | 'createdAt'
>

export type CursorPage<T> = {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
