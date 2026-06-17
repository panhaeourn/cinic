import { useEffect, useState } from 'react'
import { FileClock, Filter, Search } from 'lucide-react'

import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { auditLogApi } from '../services/accessControlApi'
import type { AuditLog } from '../types/access'

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filters, setFilters] = useState({ user: '', module: '', action: '', from: '', to: '' })
  const [totalElements, setTotalElements] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError(null)
    auditLogApi.list({
      user: filters.user,
      module: filters.module,
      action: filters.action,
      from: toIsoDateTime(filters.from),
      to: toIsoDateTime(filters.to),
    }).then((page) => {
      if (!ignore) {
        setLogs(page.content)
        setTotalElements(page.totalElements)
      }
    }).catch((caught: Error) => {
      if (!ignore) {
        setError(caught.message)
      }
    }).finally(() => {
      if (!ignore) {
        setIsLoading(false)
      }
    })
    return () => {
      ignore = true
    }
  }, [filters])

  return (
    <section className="audit-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Security history</span>
          <h1>Audit Logs</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="info">{totalElements} events</StatusBadge>
        </div>
      </header>

      {error ? <div className="form-alert">{error}</div> : null}

      <section className="audit-filter-card">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Filters</span>
            <h2>User, module, action, date</h2>
          </div>
          <Filter size={20} />
        </div>
        <div className="audit-filter-grid">
          <label className="patient-search">
            <Search size={17} />
            <input placeholder="User name or email" value={filters.user} onChange={(event) => setFilters((current) => ({ ...current, user: event.target.value }))} />
          </label>
          <input placeholder="Module" value={filters.module} onChange={(event) => setFilters((current) => ({ ...current, module: event.target.value }))} />
          <input placeholder="Action" value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} />
          <input type="datetime-local" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
          <input type="datetime-local" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
        </div>
      </section>

      <section className="audit-log-card">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Admin audit log page</span>
            <h2>Important actions</h2>
          </div>
          <FileClock size={20} />
        </div>
        <div className="audit-table">
          <div className="audit-table-row audit-table-head"><span>Time</span><span>User</span><span>Module</span><span>Action</span><span>Details</span></div>
          {isLoading ? (
            <div className="patient-empty">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="patient-empty">No audit logs found.</div>
          ) : logs.map((log) => (
            <div className="audit-table-row" key={log.id}>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
              <span>{log.actorName ?? 'System'}<small>{log.actorEmail ?? '-'}</small></span>
              <span>{log.module}</span>
              <StatusBadge tone="info">{log.action}</StatusBadge>
              <span>{log.details}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
