import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  Moon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

import anatomySystem from '../../assets/body-figma.png'
import { resolvePrimaryRole } from '../../app/layouts/navigation'
import { useAuth } from '../auth/components/AuthContext'
import { StatusBadge } from '../../shared/ui/StatusBadge'

const metricCards = [
  { label: 'Lifestyle actions', value: '12', trend: 'open care tasks', status: 'Today' },
  { label: 'Medication adherence', value: '94%', trend: '+6% this month', status: 'Good' },
  { label: 'Sleep quality', value: '86%', trend: '+12% this week', status: 'Stable' },
  { label: 'Stress index', value: '31', trend: 'low load', status: 'Calm' },
]

const concernItems = [
  { label: 'Blood Pressure', value: '110/80 mmHg', range: 'Normal', progress: 38, tone: 'info' },
  { label: 'HbA1c', value: '5.1%', range: 'Optimal', progress: 52, tone: 'success' },
  { label: 'Cholesterol', value: '190 mg/dL', range: 'Borderline', progress: 78, tone: 'warning' },
]

const planItems = [
  { time: '6 AM', value: '127', label: 'Now' },
  { time: '10 AM', value: '80', label: 'Min' },
  { time: '2 PM', value: '80', label: 'Max' },
]

type DashboardPageProps = {
  workspace?: string
}

const roleTitles: Record<string, string> = {
  ADMIN: 'Clinic Admin Dashboard',
  DOCTOR: 'Doctor Dashboard',
  PHARMACIST: 'Pharmacy Dashboard',
  RECEPTIONIST_CASHIER: 'Reception and Cashier Dashboard',
  PATIENT: 'Patient Dashboard',
  NURSE: 'Nursing Dashboard',
}

export function DashboardPage({ workspace = 'Operational Overview' }: DashboardPageProps) {
  const { user } = useAuth()
  const roles = user?.roles ?? []
  const primaryRole = resolvePrimaryRole(roles) ?? 'USER'
  const pageTitle = workspace === 'Operational Overview' ? roleTitles[primaryRole] ?? workspace : workspace

  return (
    <section className="dashboard-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Medical health dashboard</span>
          <h1>{pageTitle}</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">Secured setup</StatusBadge>
          <span>{primaryRole}</span>
        </div>
      </header>

      <div className="mediflex-grid">
        <section className="hero-health-panel">
          <div className="hero-copy">
            <span className="eyebrow">Cardiovascular System</span>
            <h2>Stomach function in digestion</h2>
            <p>The stomach helps in digestion by mixing food with acids and enzymes that break it down into a soft semi-liquid form.</p>
            <button className="secondary-action" type="button">
              View details
            </button>
          </div>
          <div className="anatomy-viewer" aria-label="Cardiovascular system visual">
            <img src={anatomySystem} alt="" />
            <span className="viewer-chip top">O2 98%</span>
            <span className="viewer-chip bottom">HR 78</span>
          </div>
          <div className="report-strip">
            <strong>Cardiovascular System Report</strong>
            <span>Updated 08:12 AM</span>
          </div>
        </section>

        <div className="clinical-stack">
          <section className="risk-card">
            <div className="panel-heading">
              <span className="eyebrow">Risk score</span>
              <span className="risk-label">High 35.4%</span>
            </div>
            <div className="risk-meter">
              <span />
            </div>
            <div className="risk-summary">
              <div className="age-card">
                <span className="signal-dot danger" />
                <small>Heart age</small>
                <strong>48</strong>
                <span>yrs</span>
              </div>
              <div className="age-card">
                <span className="signal-dot success" />
                <small>Chronological age</small>
                <strong>40</strong>
                <span>yrs</span>
              </div>
              <div className="risk-callout">
                <p>Your heart is aging 4 years faster than your chronological age.</p>
                <button type="button">View full report</button>
              </div>
            </div>
          </section>

          <section className="concerns-card">
            <div className="panel-heading">
              <h2>Key Areas of Concern</h2>
              <ArrowUpRight size={17} aria-hidden="true" />
            </div>
            <div className="concern-list">
              {concernItems.map((item) => (
                <article className="concern-item" key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </div>
                  <strong>{item.value}</strong>
                  <small>{item.range}</small>
                  <div className={`progress-track ${item.tone}`}>
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="range-row">
                    <span>40</span>
                    <span>200</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="insight-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Health Plan</h2>
            <StatusBadge tone="info">26 Mar - 24 Apr, 2026</StatusBadge>
          </div>
          <div className="chart-area" aria-hidden="true">
            <svg viewBox="0 0 640 220" role="img">
              <path className="chart-grid" d="M20 30H620M20 86H620M20 142H620M20 198H620" />
              <path
                className="chart-line"
                d="M22 130L48 150L72 96L96 122L120 116L146 128L168 104L196 132L224 118L252 124L280 112L308 116L336 86L364 52L390 100L418 128L446 140L474 112L502 118L530 126L558 104L586 114L618 108"
              />
            </svg>
          </div>
          <div className="plan-stats">
            {planItems.map((item) => (
              <div key={item.time}>
                <strong>{item.value}</strong>
                <span>bpm</span>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel pulse-panel">
          <div className="panel-heading">
            <h2>Pulse Rate</h2>
            <ArrowUpRight size={17} aria-hidden="true" />
          </div>
          <div className="pulse-gauge">
            <div>
              <strong>54 bpm</strong>
              <span>08:12 AM</span>
            </div>
          </div>
          <div className="pulse-notes">
            <div>
              <span>Stress Indicator</span>
              <StatusBadge>Mild</StatusBadge>
              <div className="mini-track warning"><span /></div>
            </div>
            <div>
              <span>Sleep Quality Impact</span>
              <StatusBadge tone="success">Good</StatusBadge>
              <div className="mini-track success"><span /></div>
            </div>
          </div>
        </section>
      </div>

      <div className="metrics-grid">
        {metricCards.map((metric, index) => {
          const icons = [CalendarClock, Activity, Moon, Sparkles]
          const Icon = icons[index]
          return (
            <article className="metric-card" key={metric.label}>
              <div className="metric-topline">
                <span>{metric.label}</span>
                <span className="metric-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
              </div>
              <strong>{metric.value}</strong>
              <small>{metric.trend}</small>
              <StatusBadge>{metric.status}</StatusBadge>
            </article>
          )
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel plan-panel">
          <div className="panel-heading">
            <h2>Lifestyle Actions</h2>
            <StatusBadge tone="info">Today</StatusBadge>
          </div>
          <div className="plan-list">
            {[
              { time: '09:00', title: 'Morning vitals review', note: 'Confirm blood pressure and oxygen saturation.' },
              { time: '13:30', title: 'Nutrition follow-up', note: 'Low sodium meal plan and hydration reminder.' },
              { time: '18:00', title: 'Light activity', note: 'Twenty minute walk if pulse remains stable.' },
            ].map((item) => (
              <div className="plan-item" key={item.title}>
                <time>{item.time}</time>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel attention-panel">
          <div className="panel-heading">
            <h2>Platform Status</h2>
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div className="status-stack">
            <div>
              <CalendarClock size={18} aria-hidden="true" />
              <span>Appointments and patient modules are waiting for the next approved step.</span>
            </div>
            <div>
              <TrendingUp size={18} aria-hidden="true" />
              <span>Signed in as {user?.fullName}; role-based routing is active.</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
