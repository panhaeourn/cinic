import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Activity,
  CalendarPlus,
  ClipboardList,
  FileClock,
  HeartPulse,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react'

import { useAuth } from '../../auth/components/AuthContext'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { patientApi } from '../services/patientApi'
import type { Gender, Patient, PatientPayload } from '../types/patient'

const emptyForm: PatientPayload = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  bloodType: '',
  allergies: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
}

function toPatientForm(patient: Patient): PatientPayload {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth,
    phone: patient.phone,
    email: patient.email ?? '',
    address: patient.address,
    bloodType: patient.bloodType ?? '',
    allergies: patient.allergies ?? '',
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
  }
}

function getAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDelta = today.getMonth() - birthDate.getMonth()

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return Number.isFinite(age) ? age : null
}

export function PatientsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<PatientPayload>(emptyForm)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [search, setSearch] = useState('')
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canCreate = useMemo(() => user?.permissions.includes('PATIENT_CREATE') ?? false, [user])
  const isEditing = Boolean(selectedPatient && canCreate)
  const selectedAge = selectedPatient ? getAge(selectedPatient.dateOfBirth) : null

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError(null)
    patientApi
      .list(search)
      .then((page) => {
        if (!ignore) {
          setPatients(page.content)
          setTotalElements(page.totalElements)
        }
      })
      .catch((caught: Error) => {
        if (!ignore) {
          setError(caught.message)
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [search])

  function updateField(field: keyof PatientPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function startNewPatient() {
    setSelectedPatient(null)
    setForm(emptyForm)
    setError(null)
    setNotice(null)
  }

  function selectPatient(patient: Patient) {
    setSelectedPatient(patient)
    setForm(toPatientForm(patient))
    setError(null)
    setNotice(null)
  }

  async function refreshPatients(nextSelected?: Patient) {
    const page = await patientApi.list(search)
    setPatients(page.content)
    setTotalElements(page.totalElements)
    if (nextSelected) {
      setSelectedPatient(nextSelected)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSaving(true)

    try {
      if (selectedPatient && canCreate) {
        const updatedPatient = await patientApi.update(selectedPatient.id, form)
        setForm(toPatientForm(updatedPatient))
        setNotice(`Patient ${updatedPatient.patientCode} was updated.`)
        await refreshPatients(updatedPatient)
      } else {
        const patient = await patientApi.create(form)
        setNotice(`Patient created with code ${patient.patientCode}.`)
        setForm(emptyForm)
        await refreshPatients(patient)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save patient.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="patients-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">People and setup</span>
          <h1>Patients</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">Auto code enabled</StatusBadge>
          <span>PYYYYNNN</span>
        </div>
      </header>

      <div className="patient-command-row">
        <article>
          <span className="command-icon">
            <Search size={17} aria-hidden="true" />
          </span>
          <strong>Search first</strong>
          <small>Find existing patients before creating a duplicate record.</small>
        </article>
        <article>
          <span className="command-icon">
            <UserPlus size={17} aria-hidden="true" />
          </span>
          <strong>Register patient</strong>
          <small>Reception or admin creates walk-in and portal-ready profiles.</small>
        </article>
        <article>
          <span className="command-icon">
            <CalendarPlus size={17} aria-hidden="true" />
          </span>
          <strong>Next step</strong>
          <small>Appointment booking and queue check-in connect in the next module.</small>
        </article>
        <article>
          <span className="command-icon">
            <FileClock size={17} aria-hidden="true" />
          </span>
          <strong>History ready</strong>
          <small>Visits, prescriptions, invoices, and encounters will attach here.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="patient-workspace">
        <section className="patient-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Patient registry</span>
              <h2>{totalElements} records</h2>
            </div>
            <UsersRound size={20} aria-hidden="true" />
          </div>

          <label className="patient-search">
            <Search size={17} aria-hidden="true" />
            <input
              placeholder="Search code, name, phone, or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="patient-table">
            <div className="patient-table-row patient-table-head">
              <span>Code</span>
              <span>Patient</span>
              <span>Gender</span>
              <span>Phone</span>
              <span>Blood</span>
            </div>
            {isLoading ? (
              <div className="patient-empty">Loading patient records...</div>
            ) : patients.length === 0 ? (
              <div className="patient-empty">No patients found.</div>
            ) : (
              patients.map((patient) => (
                <button
                  className={selectedPatient?.id === patient.id ? 'patient-table-row active' : 'patient-table-row'}
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  type="button"
                >
                  <strong>{patient.patientCode}</strong>
                  <span>
                    {patient.fullName}
                    <small>{patient.email ?? 'No email'}</small>
                  </span>
                  <span>{patient.gender}</span>
                  <span>{patient.phone}</span>
                  <span>{patient.bloodType ?? '-'}</span>
                </button>
              ))
            )}
          </div>
        </section>

        <div className="patient-side-stack">
          {selectedPatient ? (
            <section className="patient-profile-card">
              <div className="profile-code">
                <span>{selectedPatient.patientCode}</span>
                <StatusBadge tone="info">Selected</StatusBadge>
              </div>
              <div>
                <span className="eyebrow">Patient profile</span>
                <h2>{selectedPatient.fullName}</h2>
              </div>
              <div className="patient-profile-grid">
                <div>
                  <small>Age</small>
                  <strong>{selectedAge ?? '-'}</strong>
                </div>
                <div>
                  <small>Gender</small>
                  <strong>{selectedPatient.gender}</strong>
                </div>
                <div>
                  <small>Phone</small>
                  <strong>{selectedPatient.phone}</strong>
                </div>
                <div>
                  <small>Blood</small>
                  <strong>{selectedPatient.bloodType ?? '-'}</strong>
                </div>
              </div>
              <div className="patient-safety-note">
                <HeartPulse size={18} aria-hidden="true" />
                <span>{selectedPatient.allergies ? `Allergies: ${selectedPatient.allergies}` : 'No allergy note recorded.'}</span>
              </div>
            </section>
          ) : null}

          {canCreate ? (
            <section className="patient-form-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">{isEditing ? 'Update patient' : 'New patient'}</span>
                  <h2>{isEditing ? 'Maintain patient demographics' : 'Register walk-in or portal patient'}</h2>
                </div>
                <button className="secondary-action compact" onClick={startNewPatient} type="button">
                  New
                </button>
              </div>

              <form className="patient-form" onSubmit={handleSubmit}>
                <label>
                  <span>First name</span>
                  <input required value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} />
                </label>
                <label>
                  <span>Last name</span>
                  <input required value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} />
                </label>
                <label>
                  <span>Gender</span>
                  <select value={form.gender} onChange={(event) => updateField('gender', event.target.value as Gender)}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label>
                  <span>Date of birth</span>
                  <input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => updateField('dateOfBirth', event.target.value)}
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                </label>
                <label className="full-span">
                  <span>Address</span>
                  <textarea required value={form.address} onChange={(event) => updateField('address', event.target.value)} />
                </label>
                <label>
                  <span>Blood type</span>
                  <input value={form.bloodType} onChange={(event) => updateField('bloodType', event.target.value)} />
                </label>
                <label>
                  <span>Allergies</span>
                  <input value={form.allergies} onChange={(event) => updateField('allergies', event.target.value)} />
                </label>
                <label>
                  <span>Emergency contact</span>
                  <input
                    value={form.emergencyContactName}
                    onChange={(event) => updateField('emergencyContactName', event.target.value)}
                  />
                </label>
                <label>
                  <span>Emergency phone</span>
                  <input
                    value={form.emergencyContactPhone}
                    onChange={(event) => updateField('emergencyContactPhone', event.target.value)}
                  />
                </label>
                <button className="primary-action full-span" disabled={isSaving} type="submit">
                  {isSaving ? 'Saving patient...' : isEditing ? 'Update patient' : 'Create patient'}
                </button>
              </form>
            </section>
          ) : (
            <section className="patient-access-card">
              <ShieldCheck size={22} aria-hidden="true" />
              <div>
                <h2>Patient records are read-only</h2>
                <p>Your current role can search and view patient records. Registration is limited to admin and reception/cashier.</p>
              </div>
            </section>
          )}

          <section className="patient-next-card">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Clinic workflow</span>
                <h2>What happens after registration</h2>
              </div>
              <Activity size={18} aria-hidden="true" />
            </div>
            <div className="next-action-list">
              <button disabled type="button">
                <CalendarPlus size={17} aria-hidden="true" />
                <span>Create appointment</span>
                <StatusBadge tone="info">Next module</StatusBadge>
              </button>
              <button disabled type="button">
                <ClipboardList size={17} aria-hidden="true" />
                <span>Check in queue</span>
                <StatusBadge tone="info">Next module</StatusBadge>
              </button>
              <button disabled type="button">
                <FileClock size={17} aria-hidden="true" />
                <span>Open patient history</span>
                <StatusBadge tone="info">After encounters</StatusBadge>
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
