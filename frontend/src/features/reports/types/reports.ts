export type StatusCount = {
  status: string
  count: number
}

export type RevenueDaily = {
  date: string
  grossAmount: number
  refundedAmount: number
  netAmount: number
}

export type RevenueReport = {
  invoiceTotal: number
  unpaidBalance: number
  grossReceived: number
  refundedAmount: number
  netReceived: number
  dailyRevenue: RevenueDaily[]
}

export type PatientReport = {
  totalPatients: number
  newPatients: number
  portalLinkedPatients: number
}

export type AppointmentReport = {
  totalAppointments: number
  byStatus: StatusCount[]
}

export type DoctorConsultationReport = {
  doctorCode: string
  doctorName: string
  completedConsultations: number
}

export type InventoryReport = {
  medicines: number
  lowStock: number
  expiringSoon: number
  inventoryTransactions: number
}

export type PaymentMethodReport = {
  method: string
  grossAmount: number
  refundedAmount: number
  netAmount: number
  paymentCount: number
}

export type CashierIncomeReport = {
  cashierUserId: string | null
  cashierName: string
  cashierEmail: string | null
  grossAmount: number
  refundedAmount: number
  netAmount: number
  paymentCount: number
}

export type PaymentReport = {
  grossReceived: number
  refundedAmount: number
  netReceived: number
  paymentCount: number
  byMethod: PaymentMethodReport[]
  byCashier: CashierIncomeReport[]
}

export type ReportSummary = {
  range: {
    from: string
    to: string
  }
  revenue: RevenueReport
  patients: PatientReport
  appointments: AppointmentReport
  doctorConsultations: DoctorConsultationReport[]
  inventory: InventoryReport
  payments: PaymentReport
}
