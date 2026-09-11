import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import { AuthProvider } from '../features/auth/components/AuthContext'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { RoleRoute } from '../features/auth/components/RoleRoute'
import { ClinicBrandProvider } from '../shared/clinic/clinicBrand'
import { DashboardLayout } from './layouts/DashboardLayout'
import { routeRoles } from './layouts/navigation'

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const OAuthCallbackPage = lazy(() => import('../features/auth/pages/OAuthCallbackPage').then((module) => ({ default: module.OAuthCallbackPage })))
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const AccessControlPage = lazy(() => import('../features/access/pages/AccessControlPage').then((module) => ({ default: module.AccessControlPage })))
const AuditLogsPage = lazy(() => import('../features/access/pages/AuditLogsPage').then((module) => ({ default: module.AuditLogsPage })))
const AppointmentsPage = lazy(() => import('../features/appointments/pages/AppointmentsPage').then((module) => ({ default: module.AppointmentsPage })))
const BillingPage = lazy(() => import('../features/billing/pages/BillingPage').then((module) => ({ default: module.BillingPage })))
const CertificateFormPage = lazy(() => import('../features/certificates/pages/CertificateFormPage').then((module) => ({ default: module.CertificateFormPage })))
const PaymentsPage = lazy(() => import('../features/billing/pages/PaymentsPage').then((module) => ({ default: module.PaymentsPage })))
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const DepartmentsPage = lazy(() => import('../features/departments/pages/DepartmentsPage').then((module) => ({ default: module.DepartmentsPage })))
const EncountersPage = lazy(() => import('../features/encounters/pages/EncountersPage').then((module) => ({ default: module.EncountersPage })))
const PatientsPage = lazy(() => import('../features/patients/pages/PatientsPage').then((module) => ({ default: module.PatientsPage })))
const QueuePage = lazy(() => import('../features/queue/pages/QueuePage').then((module) => ({ default: module.QueuePage })))
const ReportsPage = lazy(() => import('../features/reports/pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const StaffClaimPage = lazy(() => import('../features/staff/pages/StaffClaimPage').then((module) => ({ default: module.StaffClaimPage })))
const StaffPage = lazy(() => import('../features/staff/pages/StaffPage').then((module) => ({ default: module.StaffPage })))
const VitalsPage = lazy(() => import('../features/vitals/pages/VitalsPage').then((module) => ({ default: module.VitalsPage })))

function LiquidGlassFilters() {
  return (
    <svg aria-hidden="true" className="liquid-glass-filters" focusable="false">
      <defs>
        <filter id="clinic-card-glass" colorInterpolationFilters="sRGB" x="-16%" y="-16%" width="132%" height="132%">
          <feTurbulence baseFrequency="0.007 0.012" numOctaves="2" seed="12" type="fractalNoise" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.32" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="clinic-lens-glass" colorInterpolationFilters="sRGB" x="-22%" y="-22%" width="144%" height="144%">
          <feTurbulence baseFrequency="0.011 0.016" numOctaves="2" seed="18" type="fractalNoise" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.26" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="3.8" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        <filter id="clinic-liquid-specular" colorInterpolationFilters="sRGB" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0028 0.0065" numOctaves="1" seed="17" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.9" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="1.4"
            specularConstant="0.42"
            specularExponent="64"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-120" y="-160" z="240" />
          </feSpecularLighting>
          <feComposite in="specLight" in2="SourceAlpha" operator="in" result="containedLight" />
          <feDisplacementMap in="SourceGraphic" in2="softMap" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          <feBlend in="containedLight" mode="screen" />
        </filter>
      </defs>
    </svg>
  )
}

export function App() {
  const renderDashboard = (workspace?: string, allowedRoles?: string[]) => {
    const page = (
      <DashboardLayout>
        <DashboardPage workspace={workspace} />
      </DashboardLayout>
    )

    return allowedRoles ? <RoleRoute allowedRoles={allowedRoles}>{page}</RoleRoute> : page
  }

  return (
    <>
      <LiquidGlassFilters />
      <BrowserRouter>
        <ClinicBrandProvider>
          <AuthProvider>
            <Suspense fallback={<div className="route-loading" role="status">Loading workspace…</div>}>
              <Routes>
              <Route element={<LoginPage />} path="/login" />
              <Route element={<RegisterPage />} path="/register" />
              <Route element={<OAuthCallbackPage />} path="/oauth/callback" />
              <Route element={<ProtectedRoute />}>
              <Route
                element={renderDashboard()}
                path="/app"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.patients}>
                    <DashboardLayout>
                      <PatientsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/patients"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.staff}>
                    <DashboardLayout>
                      <StaffPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/staff"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.staffClaim}>
                    <DashboardLayout>
                      <StaffClaimPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/staff-claim"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.appointments}>
                    <DashboardLayout>
                      <AppointmentsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/appointments"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.todayQueue}>
                    <DashboardLayout>
                      <QueuePage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/today-queue"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.queue}>
                    <DashboardLayout>
                      <QueuePage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/queue"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.vitals}>
                    <DashboardLayout>
                      <VitalsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/vitals"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.encounters}>
                    <DashboardLayout>
                      <EncountersPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/encounters"
              />
              <Route
                element={renderDashboard('Prescriptions', routeRoles.prescriptions)}
                path="/app/prescriptions"
              />
              <Route
                element={renderDashboard('Pharmacy', routeRoles.pharmacy)}
                path="/app/pharmacy"
              />
              <Route
                element={renderDashboard('Prescription Queue', routeRoles.prescriptionQueue)}
                path="/app/prescription-queue"
              />
              <Route
                element={renderDashboard('Medicines', routeRoles.medicines)}
                path="/app/medicines"
              />
              <Route
                element={renderDashboard('Medicine Batches', routeRoles.medicineBatches)}
                path="/app/medicine-batches"
              />
              <Route
                element={renderDashboard('Inventory', routeRoles.inventory)}
                path="/app/inventory"
              />
              <Route
                element={renderDashboard('Low Stock', routeRoles.lowStock)}
                path="/app/low-stock"
              />
              <Route
                element={renderDashboard('Expiring Medicines', routeRoles.expiringMedicines)}
                path="/app/expiring-medicines"
              />
              <Route
                element={renderDashboard('Dispensed History', routeRoles.dispensedHistory)}
                path="/app/dispensed-history"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.billing}>
                    <DashboardLayout>
                      <BillingPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/billing"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.payments}>
                    <DashboardLayout>
                      <PaymentsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/payments"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.certificates}>
                    <DashboardLayout>
                      <CertificateFormPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/certificates"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.reports}>
                    <DashboardLayout>
                      <ReportsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/reports"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.departments}>
                    <DashboardLayout>
                      <DepartmentsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/departments"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.accessControl}>
                    <DashboardLayout>
                      <AccessControlPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/access-control"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.auditLogs}>
                    <DashboardLayout>
                      <AuditLogsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/audit-logs"
              />
              <Route
                element={
                  <RoleRoute allowedRoles={routeRoles.settings}>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/settings"
              />
              <Route element={renderDashboard('My Appointments', routeRoles.myAppointments)} path="/app/my-appointments" />
              <Route element={renderDashboard('My Visit History', routeRoles.myVisitHistory)} path="/app/my-visit-history" />
              <Route element={renderDashboard('My Prescriptions', routeRoles.myPrescriptions)} path="/app/my-prescriptions" />
              <Route element={renderDashboard('My Invoices', routeRoles.myInvoices)} path="/app/my-invoices" />
              <Route element={renderDashboard('My Payments', routeRoles.myPayments)} path="/app/my-payments" />
              <Route element={renderDashboard('Profile', routeRoles.profile)} path="/app/profile" />
              <Route element={renderDashboard('Doctor Dashboard', ['ADMIN', 'DOCTOR'])} path="/app/doctor" />
              <Route element={renderDashboard('Reception and Cashier Dashboard', ['ADMIN', 'RECEPTIONIST_CASHIER'])} path="/app/reception" />
              <Route element={renderDashboard('Patient Dashboard', ['PATIENT'])} path="/app/patient" />
              <Route element={renderDashboard('Nursing Dashboard', ['ADMIN', 'NURSE'])} path="/app/nursing" />
              </Route>
              <Route element={<Navigate replace to="/app" />} path="*" />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ClinicBrandProvider>
      </BrowserRouter>
    </>
  )
}
