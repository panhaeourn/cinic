export const loadLoginPage = () => import('../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage }))
export const loadOAuthCallbackPage = () => import('../features/auth/pages/OAuthCallbackPage').then((module) => ({ default: module.OAuthCallbackPage }))
export const loadRegisterPage = () => import('../features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage }))
export const loadAccessControlPage = () => import('../features/access/pages/AccessControlPage').then((module) => ({ default: module.AccessControlPage }))
export const loadAuditLogsPage = () => import('../features/access/pages/AuditLogsPage').then((module) => ({ default: module.AuditLogsPage }))
export const loadAppointmentsPage = () => import('../features/appointments/pages/AppointmentsPage').then((module) => ({ default: module.AppointmentsPage }))
export const loadBillingPage = () => import('../features/billing/pages/BillingPage').then((module) => ({ default: module.BillingPage }))
export const loadCertificateFormPage = () => import('../features/certificates/pages/CertificateFormPage').then((module) => ({ default: module.CertificateFormPage }))
export const loadPaymentsPage = () => import('../features/billing/pages/PaymentsPage').then((module) => ({ default: module.PaymentsPage }))
export const loadDashboardPage = () => import('../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage }))
export const loadDepartmentsPage = () => import('../features/departments/pages/DepartmentsPage').then((module) => ({ default: module.DepartmentsPage }))
export const loadEncountersPage = () => import('../features/encounters/pages/EncountersPage').then((module) => ({ default: module.EncountersPage }))
export const loadPatientsPage = () => import('../features/patients/pages/PatientsPage').then((module) => ({ default: module.PatientsPage }))
export const loadQueuePage = () => import('../features/queue/pages/QueuePage').then((module) => ({ default: module.QueuePage }))
export const loadReportsPage = () => import('../features/reports/pages/ReportsPage').then((module) => ({ default: module.ReportsPage }))
export const loadSettingsPage = () => import('../features/settings/pages/SettingsPage').then((module) => ({ default: module.SettingsPage }))
export const loadStaffClaimPage = () => import('../features/staff/pages/StaffClaimPage').then((module) => ({ default: module.StaffClaimPage }))
export const loadStaffPage = () => import('../features/staff/pages/StaffPage').then((module) => ({ default: module.StaffPage }))
export const loadVitalsPage = () => import('../features/vitals/pages/VitalsPage').then((module) => ({ default: module.VitalsPage }))

const routeLoaders: Record<string, () => Promise<unknown>> = {
  '/app/patients': loadPatientsPage,
  '/app/staff': loadStaffPage,
  '/app/appointments': loadAppointmentsPage,
  '/app/queue': loadQueuePage,
  '/app/today-queue': loadQueuePage,
  '/app/vitals': loadVitalsPage,
  '/app/encounters': loadEncountersPage,
  '/app/billing': loadBillingPage,
  '/app/payments': loadPaymentsPage,
  '/app/certificates': loadCertificateFormPage,
  '/app/reports': loadReportsPage,
  '/app/departments': loadDepartmentsPage,
  '/app/access-control': loadAccessControlPage,
  '/app/audit-logs': loadAuditLogsPage,
  '/app/settings': loadSettingsPage,
  '/app/staff-claim': loadStaffClaimPage,
}

export function prefetchRoute(path: string) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return
  void (routeLoaders[path] ?? loadDashboardPage)().catch(() => { /* Navigation can retry a failed preload. */ })
}
