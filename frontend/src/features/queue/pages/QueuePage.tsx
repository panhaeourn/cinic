import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import type { FormEvent } from 'react'
import { CheckCircle2, ClipboardList, PlayCircle, Search, SkipForward, UserRoundCheck, UsersRound, XCircle } from 'lucide-react'

import { useAuth } from '../../auth/components/AuthContext'
import { appointmentApi } from '../../appointments/services/appointmentApi'
import { patientApi } from '../../patients/services/patientApi'
import { staffApi } from '../../staff/services/staffApi'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { queueApi } from '../services/queueApi'
import type { QueueCheckInPayload, QueueStatus, QueueTicket } from '../types/queue'

const statusOptions: Array<QueueStatus | ''> = ['', 'WAITING', 'CALLED', 'SKIPPED', 'COMPLETED', 'CANCELLED']

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function statusTone(status: QueueStatus) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'CANCELLED' || status === 'SKIPPED') return 'danger'
  if (status === 'CALLED') return 'info'
  return 'default'
}

export function QueuePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<QueueCheckInPayload>({ patientId: '', appointmentId: '', assignedStaffId: '', priority: 0, notes: '' })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<QueueStatus | ''>('')
  const [date, setDate] = useState(todayString())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canManage = user?.permissions.includes('QUEUE_MANAGE') ?? false
  const debouncedSearch = useDebouncedValue(search.trim())
  const queue = useQuery({
    queryKey: ['queue', { search: debouncedSearch, status, date }],
    queryFn: ({ signal }) => queueApi.list({ search: debouncedSearch, status, date }, signal),
    staleTime: 0,
  })
  const patientOptions = useQuery({
    queryKey: ['patients', 'queue-options'],
    queryFn: () => patientApi.list(''),
    enabled: canManage,
  })
  const appointmentOptions = useQuery({
    queryKey: ['appointments', 'queue-options'],
    queryFn: () => appointmentApi.list({ status: 'SCHEDULED' }),
    enabled: canManage,
  })
  const staffOptions = useQuery({
    queryKey: ['staff', 'queue-options'],
    queryFn: () => staffApi.list(''),
    enabled: canManage,
  })
  const tickets = queue.data?.content ?? []
  const patients = patientOptions.data?.content ?? []
  const appointments = appointmentOptions.data?.content ?? []
  const activeStaff = useMemo(() => staffOptions.data?.content.filter((member) => member.status === 'ACTIVE') ?? [], [staffOptions.data])
  const waitingCount = tickets.filter((ticket) => ticket.status === 'WAITING').length
  const isLoading = queue.isPending
  const loadError = queue.error ?? patientOptions.error ?? appointmentOptions.error ?? staffOptions.error

  async function loadQueue() {
    await queryClient.invalidateQueries({ queryKey: ['queue'] })
  }

  function updateField(field: keyof QueueCheckInPayload, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function pickAppointment(appointmentId: string) {
    const appointment = appointments.find((item) => item.id === appointmentId)
    setForm((current) => ({
      ...current,
      appointmentId,
      patientId: appointment?.patientId ?? current.patientId,
      assignedStaffId: appointment?.doctorId ?? current.assignedStaffId,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSaving(true)

    try {
      const ticket = await queueApi.checkIn(form)
      setNotice(`${ticket.patientName} checked in as ${ticket.queueCode}.`)
      setForm({ patientId: '', appointmentId: '', assignedStaffId: '', priority: 0, notes: '' })
      await loadQueue()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to check in patient.')
    } finally {
      setIsSaving(false)
    }
  }

  async function changeStatus(ticket: QueueTicket, nextStatus: QueueStatus) {
    setError(null)
    setNotice(null)
    try {
      const updated = await queueApi.updateStatus(ticket.id, {
        status: nextStatus,
        assignedStaffId: ticket.assignedStaffId ?? undefined,
      })
      setNotice(`${updated.queueCode} is now ${nextStatus.toLowerCase()}.`)
      await loadQueue()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update queue.')
    }
  }

  return (
    <section className="patients-page workflow-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Front desk and clinical flow</span>
          <h1>Queue</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="info">{waitingCount} waiting</StatusBadge>
          <span>{date}</span>
        </div>
      </header>

      <div className="patient-command-row">
        <article>
          <span className="command-icon"><UserRoundCheck size={17} aria-hidden="true" /></span>
          <strong>Check in patient</strong>
          <small>Generate the daily queue number and attach the visit to a patient.</small>
        </article>
        <article>
          <span className="command-icon"><ClipboardList size={17} aria-hidden="true" /></span>
          <strong>Queue status</strong>
          <small>Track waiting, called, skipped, completed, and cancelled visits.</small>
        </article>
        <article>
          <span className="command-icon"><UsersRound size={17} aria-hidden="true" /></span>
          <strong>Care team view</strong>
          <small>Doctors and nurses can see the active patient flow.</small>
        </article>
      </div>

      {error || loadError ? <div className="form-alert">{error ?? loadError?.message}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="patient-workspace">
        <section className="patient-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Today queue</span>
              <h2>{tickets.length} tickets</h2>
            </div>
            <ClipboardList size={20} aria-hidden="true" />
          </div>

          <div className="workflow-filters three">
            <label className="patient-search">
              <Search size={17} aria-hidden="true" />
              <input placeholder="Search queue, patient, or staff..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value as QueueStatus | '')}>
              {statusOptions.map((option) => (
                <option key={option || 'ALL'} value={option}>{option ? option.replaceAll('_', ' ') : 'All status'}</option>
              ))}
            </select>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <div className="workflow-list" aria-busy={queue.isFetching || search.trim() !== debouncedSearch}>
            {isLoading ? (
              <div className="patient-empty">Loading queue...</div>
            ) : tickets.length === 0 ? (
              <div className="patient-empty">No queue tickets found.</div>
            ) : (
              tickets.map((ticket) => (
                <article className="workflow-row queue-row" key={ticket.id}>
                  <div className="queue-number">{ticket.queueNumber}</div>
                  <div>
                    <strong>{ticket.patientName}</strong>
                    <small>{ticket.patientCode} • {ticket.queueCode}</small>
                  </div>
                  <div>
                    <span>{ticket.assignedStaffName ?? 'Unassigned'}</span>
                    <small>Checked in {new Date(ticket.checkedInAt).toLocaleTimeString()}</small>
                  </div>
                  <StatusBadge tone={statusTone(ticket.status)}>{ticket.status}</StatusBadge>
                  <div className="row-actions">
                    {canManage && ticket.status === 'WAITING' ? (
                      <button className="secondary-action compact" type="button" onClick={() => changeStatus(ticket, 'CALLED')}>
                        <PlayCircle size={15} aria-hidden="true" /> Call
                      </button>
                    ) : null}
                    {canManage && (ticket.status === 'WAITING' || ticket.status === 'CALLED') ? (
                      <button className="secondary-action compact" type="button" onClick={() => changeStatus(ticket, 'SKIPPED')}>
                        <SkipForward size={15} aria-hidden="true" /> Skip
                      </button>
                    ) : null}
                    {canManage && ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' ? (
                      <button className="secondary-action compact" type="button" onClick={() => changeStatus(ticket, 'COMPLETED')}>
                        <CheckCircle2 size={15} aria-hidden="true" /> Done
                      </button>
                    ) : null}
                    {canManage && ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' ? (
                      <button className="secondary-action compact danger" type="button" onClick={() => changeStatus(ticket, 'CANCELLED')}>
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
              <span className="eyebrow">Check in</span>
              <h2>Generate queue number</h2>
            </div>
            <UserRoundCheck size={18} aria-hidden="true" />
          </div>

          {canManage ? (
            <form className="patient-form" onSubmit={handleSubmit}>
              <label className="full-span">
                <span>Appointment</span>
                <select value={form.appointmentId ?? ''} onChange={(event) => pickAppointment(event.target.value)}>
                  <option value="">Walk-in or no appointment</option>
                  {appointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.patientName} - {new Date(appointment.scheduledAt).toLocaleString()}
                    </option>
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
              <label className="full-span">
                <span>Assigned staff</span>
                <select value={form.assignedStaffId ?? ''} onChange={(event) => updateField('assignedStaffId', event.target.value)}>
                  <option value="">Assign later</option>
                  {activeStaff.map((member) => (
                    <option key={member.id} value={member.id}>{member.fullName} - {member.staffType}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Priority</span>
                <input min={0} max={10} type="number" value={form.priority ?? 0} onChange={(event) => updateField('priority', Number(event.target.value))} />
              </label>
              <label className="full-span">
                <span>Notes</span>
                <textarea value={form.notes ?? ''} onChange={(event) => updateField('notes', event.target.value)} />
              </label>
              <button className="primary-action full-span" disabled={isSaving} type="submit">
                {isSaving ? 'Checking in...' : 'Check in patient'}
              </button>
            </form>
          ) : (
            <div className="patient-empty">Your role can view queue status, but cannot manage queue tickets.</div>
          )}
        </section>
      </div>
    </section>
  )
}