import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Banknote,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  PackageSearch,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react'

import { useClinicBrand } from '../../../shared/clinic/clinicBrand'
import { formatCurrencyAmount } from '../../../shared/clinic/currency'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { reportsApi } from '../services/reportsApi'
import type { ReportSummary } from '../types/reports'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function firstDayInput() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().slice(0, 10)
}

function startOfWeekInput() {
  const date = new Date()
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return date.toISOString().slice(0, 10)
}

function firstDayOfYearInput() {
  const date = new Date()
  date.setMonth(0, 1)
  return date.toISOString().slice(0, 10)
}

function statusLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function ReportsPage() {
  const { brand } = useClinicBrand()
  const [from, setFrom] = useState(firstDayInput())
  const [to, setTo] = useState(todayInput())
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const money = useMemo(() => (value: number) => formatCurrencyAmount(value, brand.currency), [brand.currency])

  function setPeriod(period: 'today' | 'week' | 'month' | 'year') {
    const today = todayInput()
    setTo(today)
    if (period === 'today') {
      setFrom(today)
    } else if (period === 'week') {
      setFrom(startOfWeekInput())
    } else if (period === 'month') {
      setFrom(firstDayInput())
    } else {
      setFrom(firstDayOfYearInput())
    }
  }

  async function loadSummary() {
    setIsLoading(true)
    setError(null)
    try {
      setSummary(await reportsApi.summary(from, to))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load reports.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  const largestDailyNet = useMemo(
    () => Math.max(1, ...(summary?.revenue.dailyRevenue.map((day) => day.netAmount) ?? [0])),
    [summary],
  )

  return (
    <section className="reports-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Clinic intelligence</span>
          <h1>Reports</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">Live data</StatusBadge>
          <span>{summary ? `${summary.range.from} to ${summary.range.to}` : 'Loading range'}</span>
        </div>
      </header>

      <div className="billing-command-row">
        <article>
          <span className="command-icon">
            <Banknote size={17} aria-hidden="true" />
          </span>
          <strong>Daily revenue</strong>
          <small>Payments, refunds, net received, and unpaid balance.</small>
        </article>
        <article>
          <span className="command-icon">
            <Users size={17} aria-hidden="true" />
          </span>
          <strong>Patient reports</strong>
          <small>Total patients, new registrations, and portal-linked records.</small>
        </article>
        <article>
          <span className="command-icon">
            <CalendarDays size={17} aria-hidden="true" />
          </span>
          <strong>Appointment reports</strong>
          <small>Status breakdown for the selected report period.</small>
        </article>
        <article>
          <span className="command-icon">
            <PackageSearch size={17} aria-hidden="true" />
          </span>
          <strong>Inventory reports</strong>
          <small>Ready for medicine stock once pharmacy tables are added.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}

      <section className="report-filter-panel">
        <label className="patient-search">
          <Search size={17} aria-hidden="true" />
          <span>Report date range</span>
        </label>
        <div className="report-period-actions">
          <button className="secondary-action compact" onClick={() => setPeriod('today')} type="button">
            Today
          </button>
          <button className="secondary-action compact" onClick={() => setPeriod('week')} type="button">
            Week
          </button>
          <button className="secondary-action compact" onClick={() => setPeriod('month')} type="button">
            Month
          </button>
          <button className="secondary-action compact" onClick={() => setPeriod('year')} type="button">
            Year
          </button>
        </div>
        <input aria-label="From date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input aria-label="To date" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <button className="secondary-action compact" onClick={loadSummary} type="button">
          <FileBarChart size={15} aria-hidden="true" />
          Refresh
        </button>
      </section>

      {isLoading || !summary ? (
        <section className="billing-list-card">
          <div className="patient-empty">Loading reports...</div>
        </section>
      ) : (
        <>
          <section className="reports-kpi-grid">
            <article>
              <Banknote size={18} aria-hidden="true" />
              <span>Net revenue</span>
              <strong>{money(summary.revenue.netReceived)}</strong>
              <small>{money(summary.revenue.refundedAmount)} refunded</small>
            </article>
            <article>
              <Users size={18} aria-hidden="true" />
              <span>New patients</span>
              <strong>{summary.patients.newPatients}</strong>
              <small>{summary.patients.totalPatients} total records</small>
            </article>
            <article>
              <CalendarDays size={18} aria-hidden="true" />
              <span>Appointments</span>
              <strong>{summary.appointments.totalAppointments}</strong>
              <small>{summary.appointments.byStatus.length} status groups</small>
            </article>
            <article>
              <Stethoscope size={18} aria-hidden="true" />
              <span>Doctor consults</span>
              <strong>
                {summary.doctorConsultations.reduce((total, doctor) => total + doctor.completedConsultations, 0)}
              </strong>
              <small>Completed encounters</small>
            </article>
          </section>

          <section className="reports-workspace">
            <article className="billing-list-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Revenue report</span>
                  <h2>Daily revenue</h2>
                </div>
                <Banknote size={20} aria-hidden="true" />
              </div>
              <div className="report-stat-row">
                <span>Invoice total</span>
                <strong>{money(summary.revenue.invoiceTotal)}</strong>
              </div>
              <div className="report-stat-row">
                <span>Unpaid balance</span>
                <strong>{money(summary.revenue.unpaidBalance)}</strong>
              </div>
              <div className="daily-revenue-list">
                {summary.revenue.dailyRevenue.length === 0 ? (
                  <div className="patient-empty">No payments in this date range.</div>
                ) : (
                  summary.revenue.dailyRevenue.map((day) => (
                    <div className="daily-revenue-row" key={day.date}>
                      <span>{day.date}</span>
                      <div>
                        <i style={{ width: `${Math.max(6, (day.netAmount / largestDailyNet) * 100)}%` }} />
                      </div>
                      <strong>{money(day.netAmount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="billing-list-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Payment report</span>
                  <h2>Payment methods</h2>
                </div>
                <ClipboardList size={20} aria-hidden="true" />
              </div>
              <div className="report-table compact-report-table">
                <div className="report-table-row report-table-head">
                  <span>Method</span>
                  <span>Count</span>
                  <span>Net</span>
                </div>
                {summary.payments.byMethod.length === 0 ? (
                  <div className="patient-empty">No payments found.</div>
                ) : (
                  summary.payments.byMethod.map((method) => (
                    <div className="report-table-row" key={method.method}>
                      <span>{statusLabel(method.method)}</span>
                      <span>{method.paymentCount}</span>
                      <strong>{money(method.netAmount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="billing-list-card report-wide-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Cashier income</span>
                  <h2>Income by receptionist</h2>
                </div>
                <Banknote size={20} aria-hidden="true" />
              </div>
              <div className="report-table cashier-report-table">
                <div className="report-table-row report-table-head">
                  <span>Receptionist/Cashier</span>
                  <span>Payments</span>
                  <span>Gross</span>
                  <span>Refund</span>
                  <span>Net income</span>
                </div>
                {summary.payments.byCashier.length === 0 ? (
                  <div className="patient-empty">No cashier payments found.</div>
                ) : (
                  summary.payments.byCashier.map((cashier) => (
                    <div className="report-table-row" key={cashier.cashierUserId ?? 'unassigned'}>
                      <span>
                        <strong>{cashier.cashierName}</strong>
                        <small>{cashier.cashierEmail ?? 'Old payment without cashier user'}</small>
                      </span>
                      <span>{cashier.paymentCount}</span>
                      <span>{money(cashier.grossAmount)}</span>
                      <span>{money(cashier.refundedAmount)}</span>
                      <strong>{money(cashier.netAmount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="billing-list-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Appointment report</span>
                  <h2>Status flow</h2>
                </div>
                <CalendarDays size={20} aria-hidden="true" />
              </div>
              <div className="status-chip-list">
                {summary.appointments.byStatus.length === 0 ? (
                  <div className="patient-empty">No appointments found.</div>
                ) : (
                  summary.appointments.byStatus.map((status) => (
                    <div className="status-chip-row" key={status.status}>
                      <span>{statusLabel(status.status)}</span>
                      <strong>{status.count}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="billing-list-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Doctor report</span>
                  <h2>Consultation count</h2>
                </div>
                <Activity size={20} aria-hidden="true" />
              </div>
              <div className="report-table compact-report-table">
                <div className="report-table-row report-table-head">
                  <span>Doctor</span>
                  <span>Code</span>
                  <span>Completed</span>
                </div>
                {summary.doctorConsultations.length === 0 ? (
                  <div className="patient-empty">No completed consultations found.</div>
                ) : (
                  summary.doctorConsultations.map((doctor) => (
                    <div className="report-table-row" key={doctor.doctorCode}>
                      <span>{doctor.doctorName}</span>
                      <span>{doctor.doctorCode}</span>
                      <strong>{doctor.completedConsultations}</strong>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="billing-list-card report-wide-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Inventory report</span>
                  <h2>Pharmacy readiness</h2>
                </div>
                <PackageSearch size={20} aria-hidden="true" />
              </div>
              <div className="reports-kpi-grid small">
                <article>
                  <span>Medicines</span>
                  <strong>{summary.inventory.medicines}</strong>
                </article>
                <article>
                  <span>Low stock</span>
                  <strong>{summary.inventory.lowStock}</strong>
                </article>
                <article>
                  <span>Expiring soon</span>
                  <strong>{summary.inventory.expiringSoon}</strong>
                </article>
                <article>
                  <span>Transactions</span>
                  <strong>{summary.inventory.inventoryTransactions}</strong>
                </article>
              </div>
              <p className="muted-copy">Inventory numbers will become live after the pharmacy inventory module is added.</p>
            </article>
          </section>
        </>
      )}
    </section>
  )
}
