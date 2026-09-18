import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { HeartPulse, Ruler, Search, Stethoscope, Thermometer, UserRoundCheck } from 'lucide-react'

import { useAuth } from '../../auth/components/AuthContext'
import { patientApi } from '../../patients/services/patientApi'
import type { Patient } from '../../patients/types/patient'
import { queueApi } from '../../queue/services/queueApi'
import type { QueueTicket } from '../../queue/types/queue'
import { staffApi } from '../../staff/services/staffApi'
import type { Staff } from '../../staff/types/staff'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { vitalsApi } from '../services/vitalsApi'
import type { Vitals, VitalsPayload } from '../types/vitals'

type VitalsForm = Record<keyof VitalsPayload, string>

const emptyForm: VitalsForm = {
  patientId: '',
  queueTicketId: '',
  encounterId: '',
  nurseId: '',
  systolicBp: '',
  diastolicBp: '',
  temperatureC: '',
  oxygenSaturation: '',
  heartRate: '',
  weightKg: '',
  heightCm: '',
  notes: '',
}

function toPayload(form: VitalsForm): VitalsPayload {
  return {
    patientId: form.patientId,
    queueTicketId: form.queueTicketId,
    nurseId: form.nurseId,
    systolicBp: form.systolicBp ? Number(form.systolicBp) : undefined,
    diastolicBp: form.diastolicBp ? Number(form.diastolicBp) : undefined,
    temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
    oxygenSaturation: form.oxygenSaturation ? Number(form.oxygenSaturation) : undefined,
    heartRate: form.heartRate ? Number(form.heartRate) : undefined,
    weightKg: form.weightKg ? Number(form.weightKg) : undefined,
    heightCm: form.heightCm ? Number(form.heightCm) : undefined,
    notes: form.notes,
  }
}

export function VitalsPage() {
  const { user } = useAuth()
  const [vitals, setVitals] = useState<Vitals[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [queue, setQueue] = useState<QueueTicket[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [form, setForm] = useState<VitalsForm>(emptyForm)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const canCreate = useMemo(() => user?.permissions.includes('VITALS_CREATE') ?? false, [user])
  const nurses = useMemo(() => staff.filter((member) => member.staffType === 'NURSE' && member.status === 'ACTIVE'), [staff])

  async function loadVitals() {
    const page = await vitalsApi.list(debouncedSearch)
    setVitals(page.content)
  }

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError(null)

    Promise.all([vitalsApi.list(debouncedSearch), patientApi.list(''), queueApi.list({ date: new Date().toISOString().slice(0, 10) }), staffApi.list('')])
      .then(([vitalsPage, patientPage, queuePage, staffPage]) => {
        if (!ignore) {
          setVitals(vitalsPage.content)
          setPatients(patientPage.content)
          setQueue(queuePage.content)
          setStaff(staffPage.content)
        }
      })
      .catch((caught: Error) => {
        if (!ignore) setError(caught.message)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [debouncedSearch])

  function updateField(field: keyof VitalsForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function pickQueue(ticketId: string) {
    const ticket = queue.find((item) => item.id === ticketId)
    setForm((current) => ({
      ...current,
      queueTicketId: ticketId,
      patientId: ticket?.patientId ?? current.patientId,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSaving(true)

    try {
      const saved = await vitalsApi.create(toPayload(form))
      setNotice(`Vitals saved for ${saved.patientName}.`)
      setForm(emptyForm)
      await loadVitals()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save vitals.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="patients-page workflow-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Nursing workspace</span>
          <h1>Vitals</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="info">{vitals.length} records</StatusBadge>
          <span>BP, temperature, oxygen, heart rate</span>
        </div>
      </header>

      <div className="patient-command-row">
        <article>
          <span className="command-icon"><HeartPulse size={17} aria-hidden="true" /></span>
          <strong>Blood pressure</strong>
          <small>Record systolic and diastolic pressure before consultation.</small>
        </article>
        <article>
          <span className="command-icon"><Thermometer size={17} aria-hidden="true" /></span>
          <strong>Temperature and oxygen</strong>
          <small>Capture temperature, SpO2, and heart rate.</small>
        </article>
        <article>
          <span className="command-icon"><Ruler size={17} aria-hidden="true" /></span>
          <strong>Weight and height</strong>
          <small>Support dosage and BMI-aware clinical decisions.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="patient-workspace">
        <section className="patient-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Vitals history</span>
              <h2>{vitals.length} measurements</h2>
            </div>
            <Stethoscope size={20} aria-hidden="true" />
          </div>
          <label className="patient-search">
            <Search size={17} aria-hidden="true" />
            <input placeholder="Search patient or nurse..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="workflow-list">
            {isLoading ? (
              <div className="patient-empty">Loading vitals...</div>
            ) : vitals.length === 0 ? (
              <div className="patient-empty">No vitals found.</div>
            ) : (
              vitals.map((item) => (
                <article className="workflow-row vitals-row" key={item.id}>
                  <div>
                    <strong>{item.patientName}</strong>
                    <small>{item.patientCode} • {new Date(item.recordedAt).toLocaleString()}</small>
                  </div>
                  <div>
                    <span>BP {item.systolicBp ?? '-'}/{item.diastolicBp ?? '-'}</span>
                    <small>HR {item.heartRate ?? '-'} • SpO2 {item.oxygenSaturation ?? '-'}%</small>
                  </div>
                  <div>
                    <span>{item.temperatureC ?? '-'} C</span>
                    <small>{item.weightKg ?? '-'} kg • {item.heightCm ?? '-'} cm</small>
                  </div>
                  <StatusBadge tone="info">{item.queueCode ?? 'Direct'}</StatusBadge>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="patient-form-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Nurse form</span>
              <h2>Record patient vitals</h2>
            </div>
            <UserRoundCheck size={18} aria-hidden="true" />
          </div>
          {canCreate ? (
            <form className="patient-form" onSubmit={handleSubmit}>
              <label className="full-span">
                <span>Queue ticket</span>
                <select value={form.queueTicketId} onChange={(event) => pickQueue(event.target.value)}>
                  <option value="">No queue link</option>
                  {queue.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>{ticket.queueCode} - {ticket.patientName}</option>
                  ))}
                </select>
              </label>
              <label className="full-span">
                <span>Patient</span>
                <select required value={form.patientId} onChange={(event) => updateField('patientId', event.target.value)}>
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.patientCode} - {patient.fullName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Systolic BP</span>
                <input type="number" value={form.systolicBp} onChange={(event) => updateField('systolicBp', event.target.value)} />
              </label>
              <label>
                <span>Diastolic BP</span>
                <input type="number" value={form.diastolicBp} onChange={(event) => updateField('diastolicBp', event.target.value)} />
              </label>
              <label>
                <span>Temperature C</span>
                <input step="0.1" type="number" value={form.temperatureC} onChange={(event) => updateField('temperatureC', event.target.value)} />
              </label>
              <label>
                <span>Oxygen %</span>
                <input type="number" value={form.oxygenSaturation} onChange={(event) => updateField('oxygenSaturation', event.target.value)} />
              </label>
              <label>
                <span>Heart rate</span>
                <input type="number" value={form.heartRate} onChange={(event) => updateField('heartRate', event.target.value)} />
              </label>
              <label>
                <span>Nurse</span>
                <select value={form.nurseId} onChange={(event) => updateField('nurseId', event.target.value)}>
                  <option value="">Not assigned</option>
                  {nurses.map((nurse) => (
                    <option key={nurse.id} value={nurse.id}>{nurse.fullName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Weight kg</span>
                <input step="0.1" type="number" value={form.weightKg} onChange={(event) => updateField('weightKg', event.target.value)} />
              </label>
              <label>
                <span>Height cm</span>
                <input step="0.1" type="number" value={form.heightCm} onChange={(event) => updateField('heightCm', event.target.value)} />
              </label>
              <label className="full-span">
                <span>Notes</span>
                <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
              </label>
              <button className="primary-action full-span" disabled={isSaving} type="submit">
                {isSaving ? 'Saving vitals...' : 'Save vitals'}
              </button>
            </form>
          ) : (
            <div className="patient-empty">Your role can view vitals, but cannot create new measurements.</div>
          )}
        </section>
      </div>
    </section>
  )
}
