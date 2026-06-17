import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, FileClock, Search, Stethoscope, UserRound, ClipboardPlus } from 'lucide-react'

import { useAuth } from '../../auth/components/AuthContext'
import { patientApi } from '../../patients/services/patientApi'
import type { Patient } from '../../patients/types/patient'
import { queueApi } from '../../queue/services/queueApi'
import type { QueueTicket } from '../../queue/types/queue'
import { staffApi } from '../../staff/services/staffApi'
import type { Staff } from '../../staff/types/staff'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { encounterApi } from '../services/encounterApi'
import type { Encounter, EncounterPayload, EncounterStatus } from '../types/encounter'

const statusOptions: Array<EncounterStatus | ''> = ['', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const emptyForm: EncounterPayload = {
  patientId: '',
  doctorId: '',
  queueTicketId: '',
  chiefComplaint: '',
  symptoms: '',
  diagnosis: '',
  notes: '',
}

function statusTone(status: EncounterStatus) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'CANCELLED') return 'danger'
  return 'info'
}

export function EncountersPage() {
  const { user } = useAuth()
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [queue, setQueue] = useState<QueueTicket[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [form, setForm] = useState<EncounterPayload>(emptyForm)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EncounterStatus | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const canCreate = useMemo(() => user?.permissions.includes('ENCOUNTER_CREATE') ?? false, [user])
  const canComplete = useMemo(() => user?.permissions.includes('ENCOUNTER_COMPLETE') ?? false, [user])
  const doctors = useMemo(() => staff.filter((member) => member.staffType === 'DOCTOR' && member.status === 'ACTIVE'), [staff])
  const activeCount = useMemo(() => encounters.filter((encounter) => encounter.status === 'IN_PROGRESS').length, [encounters])

  async function loadEncounters() {
    const page = await encounterApi.list({ search, status })
    setEncounters(page.content)
  }

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError(null)

    Promise.all([
      encounterApi.list({ search, status }),
      patientApi.list(''),
      queueApi.list({ date: new Date().toISOString().slice(0, 10) }),
      staffApi.list(''),
    ])
      .then(([encounterPage, patientPage, queuePage, staffPage]) => {
        if (!ignore) {
          setEncounters(encounterPage.content)
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
  }, [search, status])

  function updateField(field: keyof EncounterPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function pickQueue(ticketId: string) {
    const ticket = queue.find((item) => item.id === ticketId)
    setForm((current) => ({
      ...current,
      queueTicketId: ticketId,
      patientId: ticket?.patientId ?? current.patientId,
      doctorId: ticket?.assignedStaffId ?? current.doctorId,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSaving(true)

    try {
      const saved = await encounterApi.create(form)
      setNotice(`Encounter started for ${saved.patientName}.`)
      setForm(emptyForm)
      await loadEncounters()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start encounter.')
    } finally {
      setIsSaving(false)
    }
  }

  async function completeEncounter(encounter: Encounter) {
    setError(null)
    setNotice(null)
    try {
      const updated = await encounterApi.complete(encounter.id, {
        diagnosis: encounter.diagnosis ?? '',
        notes: 'Completed from doctor consultation page.',
      })
      setNotice(`${updated.patientName}'s encounter was completed.`)
      await loadEncounters()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to complete encounter.')
    }
  }

  return (
    <section className="patients-page workflow-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Doctor workspace</span>
          <h1>Encounters</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="info">{activeCount} active</StatusBadge>
          <span>Consultation notes and visit history</span>
        </div>
      </header>

      <div className="patient-command-row">
        <article>
          <span className="command-icon"><Stethoscope size={17} aria-hidden="true" /></span>
          <strong>Consultation page</strong>
          <small>Capture chief complaint, symptoms, diagnosis, and clinical notes.</small>
        </article>
        <article>
          <span className="command-icon"><ClipboardPlus size={17} aria-hidden="true" /></span>
          <strong>Queue linked</strong>
          <small>Start encounters from active queue tickets or direct patient search.</small>
        </article>
        <article>
          <span className="command-icon"><FileClock size={17} aria-hidden="true" /></span>
          <strong>Visit history</strong>
          <small>Completed encounters become the base of patient visit history.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="patient-workspace">
        <section className="patient-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Consultation list</span>
              <h2>{encounters.length} encounters</h2>
            </div>
            <UserRound size={20} aria-hidden="true" />
          </div>

          <div className="workflow-filters">
            <label className="patient-search">
              <Search size={17} aria-hidden="true" />
              <input placeholder="Search patient, doctor, or diagnosis..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value as EncounterStatus | '')}>
              {statusOptions.map((option) => (
                <option key={option || 'ALL'} value={option}>{option ? option.replaceAll('_', ' ') : 'All status'}</option>
              ))}
            </select>
          </div>

          <div className="workflow-list">
            {isLoading ? (
              <div className="patient-empty">Loading encounters...</div>
            ) : encounters.length === 0 ? (
              <div className="patient-empty">No encounters found.</div>
            ) : (
              encounters.map((encounter) => (
                <article className="workflow-row" key={encounter.id}>
                  <div>
                    <strong>{encounter.patientName}</strong>
                    <small>{encounter.patientCode} • {new Date(encounter.startedAt).toLocaleString()}</small>
                  </div>
                  <div>
                    <span>{encounter.chiefComplaint ?? 'No complaint recorded'}</span>
                    <small>{encounter.doctorName ?? 'No doctor assigned'}</small>
                  </div>
                  <StatusBadge tone={statusTone(encounter.status)}>{encounter.status.replaceAll('_', ' ')}</StatusBadge>
                  <div className="row-actions">
                    {canComplete && encounter.status === 'IN_PROGRESS' ? (
                      <button className="secondary-action compact" type="button" onClick={() => completeEncounter(encounter)}>
                        <CheckCircle2 size={15} aria-hidden="true" /> Complete
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
              <span className="eyebrow">Consultation</span>
              <h2>Start doctor encounter</h2>
            </div>
            <Stethoscope size={18} aria-hidden="true" />
          </div>
          {canCreate ? (
            <form className="patient-form" onSubmit={handleSubmit}>
              <label className="full-span">
                <span>Queue ticket</span>
                <select value={form.queueTicketId ?? ''} onChange={(event) => pickQueue(event.target.value)}>
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
              <label className="full-span">
                <span>Doctor</span>
                <select value={form.doctorId ?? ''} onChange={(event) => updateField('doctorId', event.target.value)}>
                  <option value="">Assign later</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                  ))}
                </select>
              </label>
              <label className="full-span">
                <span>Chief complaint</span>
                <textarea value={form.chiefComplaint ?? ''} onChange={(event) => updateField('chiefComplaint', event.target.value)} />
              </label>
              <label className="full-span">
                <span>Symptoms</span>
                <textarea value={form.symptoms ?? ''} onChange={(event) => updateField('symptoms', event.target.value)} />
              </label>
              <label className="full-span">
                <span>Diagnosis</span>
                <textarea value={form.diagnosis ?? ''} onChange={(event) => updateField('diagnosis', event.target.value)} />
              </label>
              <label className="full-span">
                <span>Notes</span>
                <textarea value={form.notes ?? ''} onChange={(event) => updateField('notes', event.target.value)} />
              </label>
              <button className="primary-action full-span" disabled={isSaving} type="submit">
                {isSaving ? 'Starting encounter...' : 'Start encounter'}
              </button>
            </form>
          ) : (
            <div className="patient-empty">Your role can view encounters, but cannot start consultations.</div>
          )}
        </section>
      </div>
    </section>
  )
}
