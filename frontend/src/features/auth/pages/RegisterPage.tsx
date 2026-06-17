import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'

import { useClinicBrand } from '../../../shared/clinic/clinicBrand'
import { useAuth } from '../components/AuthContext'
import { resolveRoleRedirect } from '../services/roleRedirect'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { brand } = useClinicBrand()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await register({ fullName, email, phoneNumber, password })
      navigate(resolveRoleRedirect(response.user.roles), { replace: true })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">
            {brand.logoUrl ? <img alt={`${brand.clinicName} logo`} src={brand.logoUrl} /> : <Activity size={22} aria-hidden="true" />}
          </span>
          <div>
            <strong>{brand.clinicName}</strong>
            <small>Patient account setup</small>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Clinic portal</span>
            <h1>Register</h1>
          </div>

          {error ? <p className="form-alert">{error}</p> : null}

          <label className="field">
            <span>Full name</span>
            <div>
              <UserRound size={18} aria-hidden="true" />
              <input
                autoComplete="name"
                onChange={(event) => setFullName(event.target.value)}
                required
                value={fullName}
              />
            </div>
          </label>

          <label className="field">
            <span>Email</span>
            <div>
              <Mail size={18} aria-hidden="true" />
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          </label>

          <label className="field">
            <span>Phone</span>
            <div>
              <Phone size={18} aria-hidden="true" />
              <input
                autoComplete="tel"
                onChange={(event) => setPhoneNumber(event.target.value)}
                type="tel"
                value={phoneNumber}
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div>
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          </label>

          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
