import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, LockKeyhole, Mail } from 'lucide-react'

import { useClinicBrand } from '../../../shared/clinic/clinicBrand'
import { env } from '../../../shared/config/env'
import { useAuth } from '../components/AuthContext'
import { resolveRoleRedirect } from '../services/roleRedirect'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { brand } = useClinicBrand()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const oauthError = new URLSearchParams(window.location.search).get('oauthError')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await login({ email, password })
      navigate(resolveRoleRedirect(response.user.roles), { replace: true })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Login failed')
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
            <small>Secure clinic access</small>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Welcome back</span>
            <h1>Login</h1>
          </div>

          {error || oauthError ? <p className="form-alert">{error || oauthError}</p> : null}

          <a className="google-action" href={`${env.backendBaseUrl}/oauth2/authorization/google`}>
            Continue with Google
          </a>

          <div className="auth-divider">
            <span>or</span>
          </div>

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
            <span>Password</span>
            <div>
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          </label>

          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="auth-switch">
            New to the clinic portal? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
