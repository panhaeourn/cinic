import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarClock, CalendarPlus, CheckCircle2, Clock3, Search, UserCheck, XCircle } from 'lucide-react'

import { useAuth } from '../../auth/components/AuthContext'
import { patientApi } from '../../patients/services/patientApi'
import type { Patient } from '../../patients/types/patient'
import { staffApi } from '../../staff/services/staffApi'
import type { Staff } from '../../staff/types/staff'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { appointmentApi } from '../services/appointmentApi'
import type { Appointment, AppointmentPayload, AppointmentStatus } from '../types/appointment'

const statusOptions: Array<AppointmentStatus | ''> = ['', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

function toDatetimeLocal(value: Date) {
  const offset = value.getTimezoneOffset()
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function toApiInstant(value: string) {
  return new Date(value).toISOString()
}

function emptyForm(): AppointmentPayload {
  const nextHour = new Date()
  nextHour.setMinutes(0, 0, 0)
  nextHour.setHours(nextHour.getHours() + 1)
  return {
    patientId: '',
    doctorId: '',
    scheduledAt: toDatetimeLocal(nextHour),
    durationMinutes: 30,
    reason: '',
    notes: '',
  }
}

function statusTone(status: AppointmentStatus) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'danger'
  if (status === 'CHECKED_IN' || status === 'CONFIRMED') return 'info'
  return 'default'
}

export function AppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [form, setForm] = useState<AppointmentPayload>(() => emptyForm())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canCreate = useMemo(() => user?.permissions.includes('APPOINTMENT_CREATE') ?? false, [user])
  const canUpdate = useMemo(() => user?.permissions.includes('APPOINTMENT_UPDATE') ?? false, [user])
  const canCancel = useMemo(() => user?.permissions.includes('APPOINTMENT_CANCEL') ?? false, [user])
  const doctors = useMemo(() => staff.filter((member) => member.staffType === 'DOCTOR' && member.status === 'ACTIVE'), [staff])
  const todayCount = useMemo(() => {
    const today = new Date().toDateString()
    return appointments.filter((appointment) => new Date(appointment.scheduledAt).toDateString() === today).length
  }, [appointments])

  async function loadAppointments() {
    const page = await appointmentApi.list({ search, status })
    setAppointments(page.content)
  }

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError(null)

    Promise.all([appointmentApi.list({ search, status }), patientApi.list(''), staffApi.list('')])
      .then(([appointmentPage, patientPage, staffPage]) => {
        if (!ignore) {
          setAppointments(appointmentPage.content)
          setPatients(patientPage.content)
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
  }, [search, status])

  function updateField(field: keyof AppointmentPayload, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSaving(true)

    try {
      const appointment = await appointmentApi.create({
        ...form,
        scheduledAt: toApiInstant(form.scheduledAt),
      })
      setNotice(`Appointment created for ${appointment.patientName}.`)
      setForm(emptyForm())
      await loadAppointments()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save appointment.')
    } finally {
      setIsSaving(false)
    }
  }

  async function changeStatus(appointment: Appointment, nextStatus: AppointmentStatus) {
    setError(null)
    setNotice(null)
    try {
      const updated = await appointmentApi.updateStatus(appointment.id, { status: nextStatus })
      setNotice(`${updated.patientName} is now ${nextStatus.replaceAll('_', ' ').toLowerCase()}.`)
      await loadAppointments()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update appointment.')
    }
  }

  async function cancelAppointment(appointment: Appointment) {
    setError(null)
    setNotice(null)
    try {
      const updated = await appointmentApi.cancel(appointment.id, 'Cancelled from appointment desk.')
      setNotice(`${updated.patientName}'s appointment was cancelled.`)
      await loadAppointments()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to cancel appointment.')
    }
  }

  return (
    <section className="patients-page workflow-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Scheduling workspace</span>
          <h1>Appointments</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="info">{todayCount} today</StatusBadge>
          <span>Schedule, reschedule, cancel</span>
        </div>
      </header>

      <div className="patient-command-row">
        <article>
          <span className="command-icon"><CalendarPlus size={17} aria-hidden="true" /></span>
          <strong>Create appointment</strong>
          <small>Book a patient with a doctor, time, duration, and reason.</small>
        </article>
        <article>
          <span className="command-icon"><UserCheck size={17} aria-hidden="true" /></span>
          <strong>Status flow</strong>
          <small>Move visits through confirmed, checked in, completed, or no show.</small>
        </article>
        <article>
          <span className="command-icon"><Clock3 size={17} aria-hidden="true" /></span>
          <strong>Queue ready</strong>
          <small>Checked-in appointments can connect to the queue screen.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="patient-workspace">
        <section className="patient-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Appointment list</span>
              <h2>{appointments.length} bookings</h2>
            </div>
            <CalendarClock size={20} aria-hidden="true" />
          </div>

          <div className="workflow-filters">
            <label className="patient-search">
              <Search size={17} aria-hidden="true" />
              <input placeholder="Search patient, doctor, or reason..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | '')}>
              {statusOptions.map((option) => (
                <option key={option || 'ALL'} value={option}>{option ? option.replaceAll('_', ' ') : 'All status'}</option>
              ))}
            </select>
          </div>

          <div className="workflow-list">
            {isLoading ? (
              <div className="patient-empty">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="patient-empty">No appointments found.</div>
            ) : (
              appointments.map((appointment) => (
                <article className="workflow-row" key={appointment.id}>
                  <div>
                    <strong>{appointment.patientName}</strong>
                    <small>{appointment.patientCode} • {new Date(appointment.scheduledAt).toLocaleString()}</small>
                  </div>
                  <div>
                    <span>{appointment.doctorName ?? 'No doctor assigned'}</span>
                    <small>{appointment.reason ?? 'No reason recorded'} • {appointment.durationMinutes} min</small>
                  </div>
                  <StatusBadge tone={statusTone(appointment.status)}>{appointment.status.replaceAll('_', ' ')}</StatusBadge>
                  <div className="row-actions">
                    {canUpdate && appointment.status === 'SCHEDULED' ? (
                      <button className="secondary-action compact" type="button" onClick={() => changeStatus(appointment, 'CONFIRMED')}>
                        <CheckCircle2 size={15} aria-hidden="true" /> Confirm
                      </button>
                    ) : null}
                    {canUpdate && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' ? (
                      <button className="secondary-action compact" type="button" onClick={() => changeStatus(appointment, 'COMPLETED')}>
                        Complete
                      </button>
                    ) : null}
                    {canCancel && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' ? (
                      <button className="secondary-action compact danger" type="button" onClick={() => cancelAppointment(appointment)}>
                        <XCircle size={15} aria-hidden="true" /> Cancel
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="patient-form-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">New appointment</span>
              <h2>Book patient visit</h2>
            </div>
            <CalendarPlus size={18} aria-hidden="true" />
          </div>

          {canCreate ? (
            <form className="patient-form" onSubmit={handleSubmit}>
              <label className="full-span">
                <span>Patient</span>
                <select required value={form.patientId} onChange={(event) => updateField('patientId', event.target.value)}>
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.patientCode} - {patient.fullName}</option>
                  ))}
                </select>
              </label>
              <label className="full-span">
                <span>Doctor</span>
                <select value={form.doctorId ?? ''} onChange={(event) => updateField('doctorId', event.target.value)}>
                  <option value="">Assign later</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Date and time</span>
                <input required type="datetime-local" value={form.scheduledAt} onChange={(event) => updateField('scheduledAt', event.target.value)} />
              </label>
              <label>
                <span>Duration</span>
                <input min={5} max={480} type="number" value={form.durationMinutes ?? 30} onChange={(event) => updateField('durationMinutes', Number(event.target.value))} />
              </label>
              <label className="full-span">
                <span>Reason</span>
                <input value={form.reason ?? ''} onChange={(event) => updateField('reason', event.target.value)} />
              </label>
              <label className="full-span">
                <span>Notes</span>
                <textarea value={form.notes ?? ''} onChange={(event) => updateField('notes', event.target.value)} />
              </label>
              <button className="primary-action full-span" disabled={isSaving} type="submit">
                {isSaving ? 'Creating appointment...' : 'Create appointment'}
              </button>
            </form>
          ) : (
            <div className="patient-empty">Your role can view appointments, but cannot create new bookings.</div>
          )}
        </section>
      </div>
    </section>
  )
}
