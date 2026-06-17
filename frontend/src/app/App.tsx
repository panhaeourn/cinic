import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../features/auth/components/AuthContext'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { RoleRoute } from '../features/auth/components/RoleRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { OAuthCallbackPage } from '../features/auth/pages/OAuthCallbackPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { AccessControlPage } from '../features/access/pages/AccessControlPage'
import { AuditLogsPage } from '../features/access/pages/AuditLogsPage'
import { AppointmentsPage } from '../features/appointments/pages/AppointmentsPage'
import { BillingPage } from '../features/billing/pages/BillingPage'
import { PaymentsPage } from '../features/billing/pages/PaymentsPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { EncountersPage } from '../features/encounters/pages/EncountersPage'
import { PatientsPage } from '../features/patients/pages/PatientsPage'
import { QueuePage } from '../features/queue/pages/QueuePage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { StaffClaimPage } from '../features/staff/pages/StaffClaimPage'
import { StaffPage } from '../features/staff/pages/StaffPage'
import { VitalsPage } from '../features/vitals/pages/VitalsPage'
import { ClinicBrandProvider } from '../shared/clinic/clinicBrand'
import { DashboardLayout } from './layouts/DashboardLayout'
import { routeRoles } from './layouts/navigation'

function LiquidGlassFilters() {
  return (
    <svg aria-hidden="true" className="liquid-glass-filters" focusable="false">
      <defs>
        <filter id="clinic-card-glass" colorInterpolationFilters="sRGB" x="-16%" y="-16%" width="132%" height="132%">
          <feTurbulence baseFrequency="0.011 0.018" numOctaves="2" seed="12" type="fractalNoise" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.45" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="clinic-lens-glass" colorInterpolationFilters="sRGB" x="-22%" y="-22%" width="144%" height="144%">
          <feTurbulence baseFrequency="0.018 0.026" numOctaves="2" seed="18" type="fractalNoise" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.35" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="8" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        <filter id="clinic-liquid-specular" colorInterpolationFilters="sRGB" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="1" seed="17" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.4" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="2.6"
            specularConstant="0.65"
            specularExponent="85"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-120" y="-160" z="240" />
          </feSpecularLighting>
          <feComposite in="specLight" in2="SourceAlpha" operator="in" result="containedLight" />
          <feDisplacementMap in="SourceGraphic" in2="softMap" scale="9" xChannelSelector="R" yChannelSelector="G" />
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
                  <RoleRoute allowedRoles={routeRoles.reports}>
                    <DashboardLayout>
                      <ReportsPage />
                    </DashboardLayout>
                  </RoleRoute>
                }
                path="/app/reports"
              />
              <Route element={renderDashboard('Departments', routeRoles.departments)} path="/app/departments" />
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
          </AuthProvider>
        </ClinicBrandProvider>
      </BrowserRouter>
    </>
  )
}
