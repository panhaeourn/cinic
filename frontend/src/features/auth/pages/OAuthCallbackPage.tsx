import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../components/AuthContext'
import { resolveRoleRedirect } from '../services/roleRedirect'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeGoogleLogin } = useAuth()
  const [error, setError] = useState('')
  const code = searchParams.get('code')

  useEffect(() => {
    if (!code) {
      setError('Google sign-in did not return a valid code.')
      return
    }

    completeGoogleLogin(code)
      .then((response) => navigate(resolveRoleRedirect(response.user.roles), { replace: true }))
      .catch((exception) => {
        setError(exception instanceof Error ? exception.message : 'Google sign-in failed')
      })
  }, [code, completeGoogleLogin, navigate])

  if (!code) {
    return <Navigate replace to="/login?oauthError=Missing%20Google%20login%20code" />
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-card">
          <div>
            <span className="eyebrow">Google sign-in</span>
            <h1>{error ? 'Unable to sign in' : 'Securing session'}</h1>
          </div>
          <p className={error ? 'form-alert' : 'auth-muted'}>
            {error || 'Please wait while we finish your clinic login.'}
          </p>
        </div>
      </section>
    </main>
  )
}
