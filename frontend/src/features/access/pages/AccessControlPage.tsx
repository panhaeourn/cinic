import { useEffect, useMemo, useState } from 'react'
import { KeyRound, Lock, Search, ShieldCheck, UserCog, UsersRound } from 'lucide-react'

import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { accessControlApi } from '../services/accessControlApi'
import type { Role, UserAccess } from '../types/access'

export function AccessControlPage() {
  const [users, setUsers] = useState<UserAccess[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUser, setSelectedUser] = useState<UserAccess | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [totalElements, setTotalElements] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const roleNames = useMemo(() => roles.map((role) => role.name), [roles])

  useEffect(() => {
    let ignore = false
    accessControlApi.roles().then((items) => {
      if (!ignore) {
        setRoles(items)
      }
    }).catch((caught: Error) => {
      if (!ignore) {
        setError(caught.message)
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    accessControlApi.users(search).then((page) => {
      if (!ignore) {
        setUsers(page.content)
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
  }, [search])

  useEffect(() => {
    if (isLoading || users.length === 0) {
      return
    }
    if (!selectedUser || !users.some((user) => user.id === selectedUser.id)) {
      const firstUser = users[0]
      setSelectedUser(firstUser)
      setSelectedRoles(firstUser.roles)
      setTemporaryPassword('')
    }
  }, [isLoading, selectedUser, users])

  function selectUser(user: UserAccess) {
    setSelectedUser(user)
    setSelectedRoles(user.roles)
    setTemporaryPassword('')
    setError(null)
    setNotice(null)
  }

  function toggleRole(role: string) {
    setSelectedRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])
  }

  async function refreshUser(user: UserAccess) {
    setSelectedUser(user)
    setSelectedRoles(user.roles)
    const page = await accessControlApi.users(search)
    setUsers(page.content)
    setTotalElements(page.totalElements)
  }

  async function saveRoles() {
    if (!selectedUser) {
      return
    }
    setIsSaving(true)
    setError(null)
    setNotice(null)
    try {
      const updated = await accessControlApi.updateRoles(selectedUser.id, selectedRoles)
      setNotice(`Roles updated for ${updated.email}.`)
      await refreshUser(updated)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update roles.')
    } finally {
      setIsSaving(false)
    }
  }

  async function updateStatus(enabled: boolean, accountNonLocked: boolean) {
    if (!selectedUser) {
      return
    }
    setIsSaving(true)
    setError(null)
    setNotice(null)
    try {
      const updated = await accessControlApi.updateStatus(selectedUser.id, enabled, accountNonLocked)
      setNotice(`Account controls updated for ${updated.email}.`)
      await refreshUser(updated)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update account status.')
    } finally {
      setIsSaving(false)
    }
  }

  async function resetPassword() {
    if (!selectedUser) {
      return
    }
    setIsSaving(true)
    setError(null)
    setNotice(null)
    try {
      const updated = await accessControlApi.resetPassword(selectedUser.id, temporaryPassword)
      setNotice(`Temporary password set for ${updated.email}.`)
      setTemporaryPassword('')
      await refreshUser(updated)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reset password.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="access-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin controls</span>
          <h1>Access Control</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">{roleNames.length} roles</StatusBadge>
          <span>{totalElements} users</span>
        </div>
      </header>

      <div className="access-command-row">
        <article><span className="command-icon"><UsersRound size={17} /></span><strong>Users</strong><small>Review login accounts and status.</small></article>
        <article><span className="command-icon"><ShieldCheck size={17} /></span><strong>Roles</strong><small>Assign or remove clinic roles.</small></article>
        <article><span className="command-icon"><KeyRound size={17} /></span><strong>Permissions</strong><small>Inspect role permission coverage.</small></article>
        <article><span className="command-icon"><Lock size={17} /></span><strong>Account controls</strong><small>Deactivate, unlock, or reset passwords.</small></article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="access-workspace">
        <section className="access-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Users page</span>
              <h2>{totalElements} accounts</h2>
            </div>
            <UserCog size={20} />
          </div>
          <label className="patient-search">
            <Search size={17} />
            <input placeholder="Search user name, email, or phone..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="access-table">
            <div className="access-table-row access-table-head"><span>User</span><span>Roles</span><span>Status</span></div>
            {isLoading ? (
              <div className="patient-empty">Loading accounts...</div>
            ) : users.length === 0 ? (
              <div className="patient-empty">No accounts found.</div>
            ) : users.map((user) => (
              <button className={selectedUser?.id === user.id ? 'access-table-row active' : 'access-table-row'} key={user.id} onClick={() => selectUser(user)} type="button">
                <span><strong>{user.fullName}</strong><small>{user.email}</small></span>
                <span>{user.roles.join(', ')}</span>
                <StatusBadge tone={user.enabled && user.accountNonLocked ? 'success' : 'danger'}>
                  {user.enabled ? user.accountNonLocked ? 'ACTIVE' : 'LOCKED' : 'DISABLED'}
                </StatusBadge>
              </button>
            ))}
          </div>
        </section>

        <section className="access-detail-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Roles page</span>
              <h2>{selectedUser ? selectedUser.fullName : 'Select a user'}</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          {selectedUser ? (
            <>
              <div className="role-check-grid">
                {roles.map((role) => (
                  <label key={role.id}>
                    <input checked={selectedRoles.includes(role.name)} type="checkbox" onChange={() => toggleRole(role.name)} />
                    <span>
                      <strong>{role.name}</strong>
                      <small>{role.permissions.length} permissions</small>
                    </span>
                  </label>
                ))}
              </div>
              <button className="primary-action full-span" disabled={isSaving || selectedRoles.length === 0} onClick={saveRoles} type="button">
                Save roles
              </button>

              <div className="account-control-grid">
                <button className="secondary-action" disabled={isSaving} onClick={() => updateStatus(!selectedUser.enabled, selectedUser.accountNonLocked)} type="button">
                  {selectedUser.enabled ? 'Deactivate account' : 'Activate account'}
                </button>
                <button className="secondary-action" disabled={isSaving} onClick={() => updateStatus(selectedUser.enabled, !selectedUser.accountNonLocked)} type="button">
                  {selectedUser.accountNonLocked ? 'Lock account' : 'Unlock account'}
                </button>
              </div>
              <div className="password-reset-row">
                <input placeholder="Temporary password" type="password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} />
                <button className="secondary-action" disabled={isSaving || temporaryPassword.length < 8} onClick={resetPassword} type="button">
                  Reset password
                </button>
              </div>
            </>
          ) : (
            <div className="patient-empty">Choose an account to manage roles and account controls.</div>
          )}
        </section>

        <section className="access-permissions-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Permissions page</span>
              <h2>Role permissions</h2>
            </div>
            <KeyRound size={20} />
          </div>
          <div className="permission-list">
            {roles.map((role) => (
              <details key={role.id}>
                <summary>
                  <strong>{role.name}</strong>
                  <span>{role.permissions.length} permissions</span>
                </summary>
                <div className="permission-code-grid">
                  {role.permissions.map((permission) => <code key={permission.id}>{permission.code}</code>)}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
