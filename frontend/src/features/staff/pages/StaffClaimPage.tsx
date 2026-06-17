import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, MailCheck, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/components/AuthContext'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { resolveRoleRedirect } from '../../auth/services/roleRedirect'

export function StaffClaimPage() {
  const navigate = useNavigate()
  const { claimStaffCode, user } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const response = await claimStaffCode(code)
      navigate(resolveRoleRedirect(response.user.roles), { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to claim staff access.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="staff-claim-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Staff account claim</span>
          <h1>Claim Staff Access</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">Google account required</StatusBadge>
          <span>{user?.email}</span>
        </div>
      </header>

      <div className="staff-claim-workspace">
        <section className="staff-claim-card">
          <div className="claim-hero-icon">
            <KeyRound size={28} aria-hidden="true" />
          </div>
          <span className="eyebrow">One-time code</span>
          <h2>Enter the code from your clinic admin</h2>
          <p>
            The code only works for the Gmail address on the staff profile. After claiming, your dashboard role changes from
            patient access to your staff role.
          </p>

          {error ? <div className="form-alert">{error}</div> : null}

          <form className="staff-claim-form" onSubmit={handleSubmit}>
            <label>
              <span>Claim code</span>
              <div>
                <MailCheck size={17} aria-hidden="true" />
                <input
                  autoComplete="one-time-code"
                  placeholder="CLM-ABC123"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                />
              </div>
            </label>
            <button className="primary-action" disabled={isSaving} type="submit">
              {isSaving ? 'Claiming access...' : 'Claim staff access'}
            </button>
          </form>
        </section>

        <section className="staff-claim-help-card">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <h2>How it works</h2>
            <p>Admin creates a staff profile, generates a claim code, and gives it to the staff member.</p>
            <p>The staff member signs in with Google using the same Gmail address and enters the code here.</p>
          </div>
        </section>
      </div>
    </section>
  )
}
