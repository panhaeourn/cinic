import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { BadgeCheck, Building2, KeyRound, MailCheck, Search, ShieldCheck, Trash2, UserPlus, UsersRound } from 'lucide-react'

import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { staffApi } from '../services/staffApi'
import type { Gender, Staff, StaffClaim, StaffPayload, StaffStatus, StaffType } from '../types/staff'

const staffTypes: Array<{ value: StaffType; label: string; role: string; prefix: string }> = [
  { value: 'ADMIN', label: 'Admin', role: 'ADMIN', prefix: 'ADM' },
  { value: 'DOCTOR', label: 'Doctor', role: 'DOCTOR', prefix: 'DOC' },
  { value: 'PHARMACIST', label: 'Pharmacist', role: 'PHARMACIST', prefix: 'PHA' },
  { value: 'RECEPTIONIST_CASHIER', label: 'Receptionist Cashier', role: 'RECEPTIONIST_CASHIER', prefix: 'RCP' },
  { value: 'NURSE', label: 'Nurse', role: 'NURSE', prefix: 'NUR' },
]

const emptyForm: StaffPayload = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  phone: '',
  email: '',
  staffType: 'DOCTOR',
  roleName: 'DOCTOR',
  departmentId: '',
  status: 'ACTIVE',
}

function toStaffForm(staff: Staff): StaffPayload {
  return {
    firstName: staff.firstName,
    lastName: staff.lastName,
    gender: staff.gender,
    phone: staff.phone,
    email: staff.email,
    staffType: staff.staffType,
    roleName: staff.roleName,
    departmentId: staff.departmentId ?? '',
    status: staff.status,
  }
}

function roleForStaffType(staffType: StaffType) {
  return staffTypes.find((item) => item.value === staffType)?.role ?? staffType
}

function prefixForStaffType(staffType: StaffType) {
  return staffTypes.find((item) => item.value === staffType)?.prefix ?? 'STF'
}

function claimTone(claim: StaffClaim | null) {
  if (claim?.status === 'CLAIMED') {
    return 'success' as const
  }
  if (claim?.status === 'PENDING') {
    return 'info' as const
  }
  return 'default' as const
}

function claimStatusText(claim: StaffClaim | null) {
  if (!claim) {
    return 'No claim code'
  }
  return claim.status === 'PENDING' ? 'Waiting for Gmail claim' : claim.status
}

export function StaffPage() {
  const [form, setForm] = useState<StaffPayload>(emptyForm)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [isSaving, setIsSaving] = useState(false)
  const [mutationError, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isGeneratingClaim, setIsGeneratingClaim] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditing = Boolean(selectedStaff)
  const selectedPrefix = prefixForStaffType(form.staffType)

  const client = useQueryClient()
  const staffQuery = useQuery({ queryKey: ['staff', 'list', debouncedSearch], queryFn: () => staffApi.list(debouncedSearch) })
  const departmentQuery = useQuery({ queryKey: ['departments', 'options'], queryFn: staffApi.departments })
  const claimQuery = useQuery({ queryKey: ['staff', 'claim', selectedStaff?.id], queryFn: async () => (await staffApi.latestClaim(selectedStaff!.id)) ?? null, enabled: Boolean(selectedStaff) })
  const claim = claimQuery.data ?? null
  const isLoadingClaim = claimQuery.isPending && Boolean(selectedStaff)
  const staff = staffQuery.data?.content ?? []
  const departments = departmentQuery.data ?? []
  const totalElements = staffQuery.data?.totalElements ?? 0
  const isLoading = staffQuery.isPending
  const error = mutationError ?? staffQuery.error?.message ?? departmentQuery.error?.message ?? claimQuery.error?.message

  useEffect(() => {
    const latest = staffQuery.data?.content.find(member => member.id === selectedStaff?.id)
    if (latest) setSelectedStaff(latest)
  }, [staffQuery.data, selectedStaff?.id])

  function updateField(field: keyof StaffPayload, value: string) {
    setForm((current) => {
      if (field === 'staffType') {
        return { ...current, staffType: value as StaffType, roleName: roleForStaffType(value as StaffType) }
      }

      return { ...current, [field]: value }
    })
  }

  function startNewStaff() {
    setSelectedStaff(null)
    setForm(emptyForm)
    setError(null)
    setNotice(null)
  }

  function selectStaff(staffMember: Staff) {
    setSelectedStaff(staffMember)
    setForm(toStaffForm(staffMember))
    setError(null)
    setNotice(null)
  }

  async function refreshStaff(nextSelected?: Staff) {
    await client.invalidateQueries({ queryKey: ['staff'] })
    if (nextSelected) {
      setSelectedStaff(nextSelected)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSaving(true)

    const payload: StaffPayload = {
      ...form,
      departmentId: form.departmentId || undefined,
    }

    try {
      if (selectedStaff) {
        const updatedStaff = await staffApi.update(selectedStaff.id, payload)
        setForm(toStaffForm(updatedStaff))
        setNotice(`Staff profile ${updatedStaff.staffCode} was updated.`)
        await refreshStaff(updatedStaff)
      } else {
        const createdStaff = await staffApi.create(payload)
        setNotice(`Staff created with code ${createdStaff.staffCode}.`)
        setForm(toStaffForm(createdStaff))
        await refreshStaff(createdStaff)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save staff profile.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleGenerateClaim() {
    if (!selectedStaff) {
      return
    }

    setError(null)
    setNotice(null)
    setIsGeneratingClaim(true)
    try {
      const generatedClaim = await staffApi.generateClaim(selectedStaff.id)
      client.setQueryData(['staff', 'claim', selectedStaff.id], generatedClaim)
      setNotice(`Claim code generated for ${generatedClaim.targetEmail}.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to generate staff claim code.')
    } finally {
      setIsGeneratingClaim(false)
    }
  }

  async function handleDeleteStaff() {
    if (!selectedStaff) {
      return
    }

    const confirmed = window.confirm(`Delete staff profile ${selectedStaff.staffCode}? This will remove staff access if the Gmail is linked.`)
    if (!confirmed) {
      return
    }

    setError(null)
    setNotice(null)
    setIsDeleting(true)
    try {
      await staffApi.delete(selectedStaff.id)
      setNotice(`Staff profile ${selectedStaff.staffCode} was deleted.`)
      setSelectedStaff(null)
      setForm(emptyForm)
        await refreshStaff()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete staff profile.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="staff-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">People and access</span>
          <h1>Staff Management</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">Staff code enabled</StatusBadge>
          <span>{selectedPrefix}YYYYNNN</span>
        </div>
      </header>

      <div className="staff-command-row">
        <article>
          <span className="command-icon">
            <UserPlus size={17} aria-hidden="true" />
          </span>
          <strong>Create staff</strong>
          <small>Generate official staff codes for clinic workers.</small>
        </article>
        <article>
          <span className="command-icon">
            <BadgeCheck size={17} aria-hidden="true" />
          </span>
          <strong>Assign type</strong>
          <small>Classify doctors, nurses, pharmacists, reception, and admin staff.</small>
        </article>
        <article>
          <span className="command-icon">
            <Building2 size={17} aria-hidden="true" />
          </span>
          <strong>Set department</strong>
          <small>Use the clinic department lookup until full department management is built.</small>
        </article>
        <article>
          <span className="command-icon">
            <KeyRound size={17} aria-hidden="true" />
          </span>
          <strong>Gmail claim</strong>
          <small>Generate a one-time claim code so staff can upgrade their Google login.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="staff-workspace">
        <section className="staff-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Staff registry</span>
              <h2>{totalElements} staff records</h2>
            </div>
            <UsersRound size={20} aria-hidden="true" />
          </div>

          <label className="patient-search">
            <Search size={17} aria-hidden="true" />
            <input
              placeholder="Search code, name, role, phone, or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="staff-table">
            <div className="staff-table-row staff-table-head">
              <span>Code</span>
              <span>Staff</span>
              <span>Type</span>
              <span>Department</span>
              <span>Status</span>
            </div>
            {isLoading ? (
              <div className="patient-empty">Loading staff records...</div>
            ) : staff.length === 0 ? (
              <div className="patient-empty">No staff found.</div>
            ) : (
              staff.map((staffMember) => (
                <button
                  className={selectedStaff?.id === staffMember.id ? 'staff-table-row active' : 'staff-table-row'}
                  key={staffMember.id}
                  onClick={() => selectStaff(staffMember)}
                  type="button"
                >
                  <strong>{staffMember.staffCode}</strong>
                  <span>
                    {staffMember.fullName}
                    <small>{staffMember.email}</small>
                  </span>
                  <span>{staffMember.staffType.replace('_', ' ')}</span>
                  <span>{staffMember.departmentName ?? '-'}</span>
                  <StatusBadge tone={staffMember.status === 'ACTIVE' ? 'success' : 'info'}>{staffMember.status}</StatusBadge>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="staff-form-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{isEditing ? 'Update staff' : 'New staff'}</span>
              <h2>{isEditing ? 'Maintain staff assignment' : 'Create staff profile'}</h2>
            </div>
            <div className="panel-actions">
              {selectedStaff ? (
                <button className="danger-action compact" disabled={isDeleting} onClick={handleDeleteStaff} type="button">
                  <Trash2 size={14} aria-hidden="true" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              ) : null}
              <button className="secondary-action compact" onClick={startNewStaff} type="button">
                New
              </button>
            </div>
          </div>

          {selectedStaff ? (
            <div className="staff-profile-strip">
              <ShieldCheck size={18} aria-hidden="true" />
              <div>
                <strong>{selectedStaff.staffCode}</strong>
                <span>
                  {selectedStaff.roleName} access profile - {selectedStaff.userId ? 'Gmail linked' : claimStatusText(claim)}
                </span>
              </div>
              <StatusBadge tone={selectedStaff.userId ? 'success' : claimTone(claim)}>
                {selectedStaff.userId ? 'LINKED' : claim?.status ?? 'NOT GENERATED'}
              </StatusBadge>
            </div>
          ) : null}

          <div className="staff-claim-panel">
            <div>
              <span className="eyebrow">Gmail claim code</span>
              <h2>{selectedStaff ? 'Generate staff access code' : 'Create or select staff first'}</h2>
              <p>
                {selectedStaff ? (
                  <>
                    Staff signs in with Google using <strong>{selectedStaff.email}</strong>. This code upgrades that Gmail account
                    to <strong> {selectedStaff.roleName}</strong> access after they claim it.
                  </>
                ) : (
                  'Create the staff profile with Gmail and staff type first. The generated code will be locked to that Gmail.'
                )}
              </p>
            </div>
            <button
              className="secondary-action compact"
              disabled={!selectedStaff || Boolean(selectedStaff.userId) || isGeneratingClaim || isLoadingClaim}
              onClick={handleGenerateClaim}
              type="button"
            >
              {isGeneratingClaim ? 'Generating...' : selectedStaff?.userId ? 'Already linked' : 'Generate code'}
            </button>
            {claim ? (
              <div className="claim-code-box">
                <MailCheck size={18} aria-hidden="true" />
                <div>
                  <strong>{claim.claimCode}</strong>
                  <span>
                    {claim.status === 'CLAIMED'
                      ? `Claimed ${claim.usedAt ? new Date(claim.usedAt).toLocaleString() : ''}`
                      : `Status ${claim.status} - expires ${new Date(claim.expiresAt).toLocaleString()}`}
                  </span>
                </div>
                <StatusBadge tone={claimTone(claim)}>{claim.status}</StatusBadge>
              </div>
            ) : selectedStaff ? (
              <div className="claim-code-box muted">
                <MailCheck size={18} aria-hidden="true" />
                <div>
                  <strong>{isLoadingClaim ? 'Checking claim status...' : 'No code generated yet'}</strong>
                  <span>Generate a one-time code after confirming the Gmail and staff type.</span>
                </div>
              </div>
            ) : null}
          </div>

          <form className="staff-form" onSubmit={handleSubmit}>
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
              <span>Status</span>
              <select value={form.status} onChange={(event) => updateField('status', event.target.value as StaffStatus)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label>
              <span>Phone</span>
              <input required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
            </label>
            <label>
              <span>Staff type</span>
              <select value={form.staffType} onChange={(event) => updateField('staffType', event.target.value as StaffType)}>
                {staffTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Role</span>
              <select value={form.roleName} onChange={(event) => updateField('roleName', event.target.value)}>
                {staffTypes.map((type) => (
                  <option key={type.role} value={type.role}>
                    {type.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-span">
              <span>Department</span>
              <select value={form.departmentId ?? ''} onChange={(event) => updateField('departmentId', event.target.value)}>
                <option value="">No department assigned</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-action full-span" disabled={isSaving} type="submit">
              {isSaving ? 'Saving staff...' : isEditing ? 'Update staff' : 'Create staff'}
            </button>
          </form>
        </section>
      </div>
    </section>
  )
}
