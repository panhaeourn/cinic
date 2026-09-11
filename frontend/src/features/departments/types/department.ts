export type DepartmentStatus = 'ACTIVE' | 'INACTIVE'

export type Department = {
  id: string
  name: string
  description?: string | null
  status: DepartmentStatus
}

export type DepartmentPayload = {
  name: string
  description: string
  status: DepartmentStatus
}
