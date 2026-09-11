export type InvoiceStatus = 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'

export type InvoiceItemType = 'CONSULTATION' | 'MEDICINE' | 'SERVICE' | 'OTHER'

export type PaymentMethod = 'CASH' | 'BAKONG_KHQR' | 'ACLEDA' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT'

export type InvoiceItem = {
  id: string
  itemType: InvoiceItemType
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  createdAt: string
}

export type Payment = {
  id: string
  invoiceId: string
  invoiceNumber: string
  patientCode: string
  patientName: string
  paymentNumber: string
  method: PaymentMethod
  amount: number
  refundedAmount: number
  netAmount: number
  receivedByUserId: string | null
  receivedByName: string | null
  receivedByEmail: string | null
  referenceNumber: string | null
  note: string | null
  refundReason: string | null
  refundedAt: string | null
  paidAt: string
  createdAt: string
}

export type PaymentSummary = {
  grossAmount: number
  refundedAmount: number
  netAmount: number
  paymentCount: number
}

export type Invoice = {
  id: string
  invoiceNumber: string
  patientId: string
  patientCode: string
  patientName: string
  status: InvoiceStatus
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  notes: string | null
  issuedAt: string
  dueAt: string | null
  items: InvoiceItem[]
  payments: Payment[]
  createdAt: string
  updatedAt: string
}

export type InvoiceItemPayload = {
  itemType?: InvoiceItemType
  description: string
  quantity: number
  unitPrice: number
}

export type InvoicePayload = {
  patientId: string
  items: InvoiceItemPayload[]
  discountAmount?: number
  taxAmount?: number
  notes?: string
  dueAt?: string
}

export type PaymentPayload = {
  method: PaymentMethod
  amount: number
  referenceNumber?: string
  note?: string
}

export type PaymentRefundPayload = {
  amount: number
  reason?: string
}

export type ServicePrice = {
  id: string
  code: string
  name: string
  itemType: InvoiceItemType
  category: string
  price: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ServicePricePayload = {
  code: string
  name: string
  itemType: InvoiceItemType
  category: string
  price: number
  active?: boolean
}

export type BakongQr = {
  success: boolean
  amount: number
  qr: string
  md5: string
  expiresAt: number
  remainingSeconds: number
}

export type BakongCheckResponse = {
  success: boolean
  md5: string
  paid?: boolean
  status?: string
  message?: string
  verificationPending?: boolean
  verificationBlocked?: boolean
  data: unknown
  sourceUrl?: string
}

export type Receipt = {
  invoiceId: string
  invoiceNumber: string
  patientCode: string
  patientName: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  payments: Payment[]
  issuedAt: string
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
