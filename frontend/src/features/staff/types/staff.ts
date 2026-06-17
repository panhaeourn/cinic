export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export type StaffType = 'ADMIN' | 'DOCTOR' | 'PHARMACIST' | 'RECEPTIONIST_CASHIER' | 'NURSE'

export type StaffStatus = 'ACTIVE' | 'INACTIVE'

export type Staff = {
  id: string
  staffCode: string
  userId: string | null
  firstName: string
  lastName: string
  fullName: string
  gender: Gender
  phone: string
  email: string
  staffType: StaffType
  roleName: string
  departmentId: string | null
  departmentName: string | null
  status: StaffStatus
  createdAt: string
  updatedAt: string
}

export type Department = {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export type StaffPayload = {
  firstName: string
  lastName: string
  gender: Gender
  phone: string
  email: string
  staffType: StaffType
  roleName: string
  departmentId?: string
  status: StaffStatus
}

export type StaffClaim = {
  id: string
  staffId: string
  staffCode: string
  staffName: string
  claimCode: string
  targetEmail: string
  roleName: string
  createdAt: string
  expiresAt: string
  used: boolean
  usedAt: string | null
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED'
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
