import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CircleCheckBig, CircleOff, Plus, Search, UsersRound } from 'lucide-react'

import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { departmentApi } from '../services/departmentApi'
import type { Department, DepartmentPayload } from '../types/department'

const emptyForm: DepartmentPayload = {
  name: '',
  description: '',
  status: 'ACTIVE',
}

function toForm(department: Department): DepartmentPayload {
  return {
    name: department.name,
    description: department.description ?? '',
    status: department.status,
  }
}

export function DepartmentsPage() {
  const queryClient = useQueryClient()
  const departmentsQuery = useQuery({
    queryKey: ['departments', 'manage'],
    queryFn: departmentApi.list,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<DepartmentPayload>(emptyForm)
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data])
  const visibleDepartments = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return departments
    return departments.filter((department) =>
      department.name.toLowerCase().includes(needle)
      || department.description?.toLowerCase().includes(needle),
    )
  }, [departments, search])
  const activeCount = departments.filter((department) => department.status === 'ACTIVE').length
  const selectedDepartment = departments.find((department) => department.id === selectedId) ?? null

  function selectDepartment(department: Department) {
    setSelectedId(department.id)
    setForm(toForm(department))
    setError(null)
    setNotice(null)
  }

  function startNew() {
    setSelectedId(null)
    setForm(emptyForm)
    setError(null)
    setNotice(null)
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['departments', 'manage'] }),
      queryClient.invalidateQueries({ queryKey: ['departments'] }),
    ])
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setNotice(null)
    try {
      const saved = selectedId
        ? await departmentApi.update(selectedId, form)
        : await departmentApi.create(form)
      setSelectedId(saved.id)
      setForm(toForm(saved))
      setNotice(`${saved.name} was ${selectedId ? 'updated' : 'created'}.`)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save department.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus() {
    if (!selectedDepartment) return
    setIsSaving(true)
    setError(null)
    setNotice(null)
    try {
      const nextStatus = selectedDepartment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      const saved = await departmentApi.setStatus(selectedDepartment.id, nextStatus)
      setForm(toForm(saved))
      setNotice(`${saved.name} is now ${saved.status.toLowerCase()}.`)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to change department status.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="departments-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Clinic setup</span>
          <h1>Departments</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">{activeCount} active</StatusBadge>
          <span>{departments.length} total</span>
        </div>
      </header>

      <div className="department-command-row">
        <article><span className="command-icon"><Building2 size={18} /></span><strong>Structure</strong><small>Organize clinical teams and services.</small></article>
        <article><span className="command-icon"><UsersRound size={18} /></span><strong>Staff assignment</strong><small>Departments are immediately available in staff profiles.</small></article>
        <article><span className="command-icon"><CircleCheckBig size={18} /></span><strong>Safe lifecycle</strong><small>Deactivate old departments without losing staff history.</small></article>
      </div>

      {error || departmentsQuery.error ? <div className="form-alert">{error ?? departmentsQuery.error?.message}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="department-workspace">
        <section className="department-list-card">
          <div className="panel-heading">
            <div><span className="eyebrow">Directory</span><h2>{visibleDepartments.length} departments</h2></div>
            <button className="secondary-action" onClick={startNew} type="button"><Plus size={16} /> New</button>
          </div>
          <label className="patient-search">
            <Search size={17} />
            <input aria-label="Search departments" placeholder="Search name or description..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="department-list" aria-busy={departmentsQuery.isLoading}>
            {departmentsQuery.isLoading ? <div className="patient-empty">Loading departments...</div> : null}
            {!departmentsQuery.isLoading && visibleDepartments.length === 0 ? <div className="patient-empty">No departments found.</div> : null}
            {visibleDepartments.map((department) => (
              <button className={selectedId === department.id ? 'department-row active' : 'department-row'} key={department.id} onClick={() => selectDepartment(department)} type="button">
                <span className="department-row-icon"><Building2 size={18} /></span>
                <span><strong>{department.name}</strong><small>{department.description || 'No description yet'}</small></span>
                <StatusBadge tone={department.status === 'ACTIVE' ? 'success' : 'default'}>{department.status}</StatusBadge>
              </button>
            ))}
          </div>
        </section>

        <section className="department-form-card">
          <div className="panel-heading">
            <div><span className="eyebrow">{selectedDepartment ? 'Update department' : 'Create department'}</span><h2>{selectedDepartment?.name ?? 'New department'}</h2></div>
            <Building2 size={21} />
          </div>
          <form className="department-form" onSubmit={save}>
            <label><span>Name</span><input maxLength={120} placeholder="e.g. Cardiology" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DepartmentPayload['status'] }))}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
            <label className="full-span"><span>Description</span><textarea maxLength={2000} placeholder="Services, responsibilities, or location..." value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <div className="department-form-actions full-span">
              {selectedDepartment ? <button className="secondary-action" disabled={isSaving} onClick={toggleStatus} type="button">{selectedDepartment.status === 'ACTIVE' ? <CircleOff size={16} /> : <CircleCheckBig size={16} />}{selectedDepartment.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</button> : <span />}
              <button className="primary-action" disabled={isSaving || !form.name.trim()} type="submit">{isSaving ? 'Saving...' : selectedDepartment ? 'Save changes' : 'Create department'}</button>
            </div>
          </form>
          <p className="department-safety-note">Inactive departments stay attached to historical staff records and disappear from new assignment choices.</p>
        </section>
      </div>
    </section>
  )
}
