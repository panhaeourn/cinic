import {
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FileClock,
  FileText,
  KeyRound,
  LayoutDashboard,
  Pill,
  Settings,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ClinicRole =
  | 'ADMIN'
  | 'DOCTOR'
  | 'PHARMACIST'
  | 'RECEPTIONIST_CASHIER'
  | 'PATIENT'
  | 'NURSE'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  allowedRoles: ClinicRole[]
  status?: 'ready' | 'planned'
}

const rolePriority: ClinicRole[] = ['ADMIN', 'DOCTOR', 'PHARMACIST', 'RECEPTIONIST_CASHIER', 'NURSE', 'PATIENT']
const allRoles: ClinicRole[] = ['ADMIN', 'DOCTOR', 'PHARMACIST', 'RECEPTIONIST_CASHIER', 'NURSE', 'PATIENT']
const navigationOrderByRole: Record<ClinicRole, string[]> = {
  ADMIN: [
    'Dashboard',
    'Patients',
    'Staff',
    'Appointments',
    'Queue',
    'Vitals',
    'Encounters',
    'Prescriptions',
    'Pharmacy',
    'Billing',
    'Reports',
    'Departments',
    'Access Control',
    'Audit Logs',
    'Settings',
  ],
  RECEPTIONIST_CASHIER: ['Dashboard', 'Patients', 'Appointments', 'Queue', 'Billing', 'Payments', 'Reports'],
  DOCTOR: ['Dashboard', 'Today Queue', 'Appointments', 'Patients', 'Encounters', 'Prescriptions'],
  NURSE: ['Dashboard', 'Queue', 'Patients', 'Vitals', 'Encounters'],
  PHARMACIST: [
    'Dashboard',
    'Prescription Queue',
    'Medicines',
    'Medicine Batches',
    'Inventory',
    'Low Stock',
    'Expiring Medicines',
    'Dispensed History',
  ],
  PATIENT: [
    'Dashboard',
    'My Appointments',
    'My Visit History',
    'My Prescriptions',
    'My Invoices',
    'My Payments',
    'Claim Staff',
    'Profile',
  ],
}

export const routeRoles = {
  dashboard: allRoles,
  patients: ['ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE'],
  staff: ['ADMIN'],
  staffClaim: ['PATIENT'],
  appointments: ['ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER'],
  todayQueue: ['DOCTOR'],
  queue: ['ADMIN', 'RECEPTIONIST_CASHIER', 'NURSE'],
  encounters: ['ADMIN', 'DOCTOR', 'NURSE'],
  prescriptions: ['ADMIN', 'DOCTOR'],
  pharmacy: ['ADMIN'],
  billing: ['ADMIN', 'RECEPTIONIST_CASHIER'],
  payments: ['ADMIN', 'RECEPTIONIST_CASHIER'],
  reports: ['ADMIN', 'RECEPTIONIST_CASHIER'],
  departments: ['ADMIN'],
  accessControl: ['ADMIN'],
  auditLogs: ['ADMIN'],
  settings: ['ADMIN'],
  vitals: ['ADMIN', 'NURSE'],
  prescriptionQueue: ['PHARMACIST'],
  medicines: ['PHARMACIST'],
  medicineBatches: ['PHARMACIST'],
  inventory: ['PHARMACIST'],
  lowStock: ['PHARMACIST'],
  expiringMedicines: ['PHARMACIST'],
  dispensedHistory: ['PHARMACIST'],
  myAppointments: ['PATIENT'],
  myVisitHistory: ['PATIENT'],
  myPrescriptions: ['PATIENT'],
  myInvoices: ['PATIENT'],
  myPayments: ['PATIENT'],
  profile: ['PATIENT'],
} satisfies Record<string, ClinicRole[]>

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/app',
    icon: LayoutDashboard,
    allowedRoles: routeRoles.dashboard,
    status: 'ready',
  },
  {
    label: 'Patients',
    path: '/app/patients',
    icon: Users,
    allowedRoles: routeRoles.patients,
    status: 'ready',
  },
  {
    label: 'Staff',
    path: '/app/staff',
    icon: UserRound,
    allowedRoles: routeRoles.staff,
    status: 'ready',
  },
  {
    label: 'Today Queue',
    path: '/app/today-queue',
    icon: ClipboardList,
    allowedRoles: routeRoles.todayQueue,
    status: 'ready',
  },
  {
    label: 'Appointments',
    path: '/app/appointments',
    icon: CalendarDays,
    allowedRoles: routeRoles.appointments,
    status: 'ready',
  },
  {
    label: 'Queue',
    path: '/app/queue',
    icon: ClipboardList,
    allowedRoles: routeRoles.queue,
    status: 'ready',
  },
  {
    label: 'Vitals',
    path: '/app/vitals',
    icon: Stethoscope,
    allowedRoles: routeRoles.vitals,
    status: 'ready',
  },
  {
    label: 'Encounters',
    path: '/app/encounters',
    icon: Stethoscope,
    allowedRoles: routeRoles.encounters,
    status: 'ready',
  },
  {
    label: 'Prescriptions',
    path: '/app/prescriptions',
    icon: FileText,
    allowedRoles: routeRoles.prescriptions,
    status: 'planned',
  },
  {
    label: 'Prescription Queue',
    path: '/app/prescription-queue',
    icon: FileText,
    allowedRoles: routeRoles.prescriptionQueue,
    status: 'planned',
  },
  {
    label: 'Pharmacy',
    path: '/app/pharmacy',
    icon: Pill,
    allowedRoles: routeRoles.pharmacy,
    status: 'planned',
  },
  {
    label: 'Medicines',
    path: '/app/medicines',
    icon: Pill,
    allowedRoles: routeRoles.medicines,
    status: 'planned',
  },
  {
    label: 'Medicine Batches',
    path: '/app/medicine-batches',
    icon: Building2,
    allowedRoles: routeRoles.medicineBatches,
    status: 'planned',
  },
  {
    label: 'Inventory',
    path: '/app/inventory',
    icon: ClipboardList,
    allowedRoles: routeRoles.inventory,
    status: 'planned',
  },
  {
    label: 'Low Stock',
    path: '/app/low-stock',
    icon: FileBarChart,
    allowedRoles: routeRoles.lowStock,
    status: 'planned',
  },
  {
    label: 'Expiring Medicines',
    path: '/app/expiring-medicines',
    icon: FileClock,
    allowedRoles: routeRoles.expiringMedicines,
    status: 'planned',
  },
  {
    label: 'Dispensed History',
    path: '/app/dispensed-history',
    icon: FileText,
    allowedRoles: routeRoles.dispensedHistory,
    status: 'planned',
  },
  {
    label: 'Billing',
    path: '/app/billing',
    icon: CreditCard,
    allowedRoles: routeRoles.billing,
    status: 'ready',
  },
  {
    label: 'Payments',
    path: '/app/payments',
    icon: CreditCard,
    allowedRoles: routeRoles.payments,
    status: 'ready',
  },
  {
    label: 'Reports',
    path: '/app/reports',
    icon: FileBarChart,
    allowedRoles: routeRoles.reports,
    status: 'ready',
  },
  {
    label: 'Departments',
    path: '/app/departments',
    icon: Building2,
    allowedRoles: routeRoles.departments,
    status: 'planned',
  },
  {
    label: 'Access Control',
    path: '/app/access-control',
    icon: KeyRound,
    allowedRoles: routeRoles.accessControl,
    status: 'planned',
  },
  {
    label: 'Audit Logs',
    path: '/app/audit-logs',
    icon: FileClock,
    allowedRoles: routeRoles.auditLogs,
    status: 'planned',
  },
  {
    label: 'Settings',
    path: '/app/settings',
    icon: Settings,
    allowedRoles: routeRoles.settings,
    status: 'ready',
  },
  {
    label: 'My Appointments',
    path: '/app/my-appointments',
    icon: CalendarDays,
    allowedRoles: routeRoles.myAppointments,
    status: 'planned',
  },
  {
    label: 'My Visit History',
    path: '/app/my-visit-history',
    icon: FileClock,
    allowedRoles: routeRoles.myVisitHistory,
    status: 'planned',
  },
  {
    label: 'My Prescriptions',
    path: '/app/my-prescriptions',
    icon: FileText,
    allowedRoles: routeRoles.myPrescriptions,
    status: 'planned',
  },
  {
    label: 'My Invoices',
    path: '/app/my-invoices',
    icon: CreditCard,
    allowedRoles: routeRoles.myInvoices,
    status: 'planned',
  },
  {
    label: 'My Payments',
    path: '/app/my-payments',
    icon: CreditCard,
    allowedRoles: routeRoles.myPayments,
    status: 'planned',
  },
  {
    label: 'Claim Staff',
    path: '/app/staff-claim',
    icon: KeyRound,
    allowedRoles: routeRoles.staffClaim,
    status: 'ready',
  },
  {
    label: 'Profile',
    path: '/app/profile',
    icon: UserRound,
    allowedRoles: routeRoles.profile,
    status: 'planned',
  },
]

export function resolvePrimaryRole(roles: string[]) {
  return rolePriority.find((role) => roles.includes(role)) ?? (roles[0] as ClinicRole | undefined)
}

export function getVisibleNavigationItems(roles: string[]) {
  const primaryRole = resolvePrimaryRole(roles)
  if (!primaryRole) {
    return []
  }
  const order = navigationOrderByRole[primaryRole]
  return navigationItems
    .filter((item) => item.allowedRoles.includes(primaryRole))
    .sort((left, right) => order.indexOf(left.label) - order.indexOf(right.label))
}
