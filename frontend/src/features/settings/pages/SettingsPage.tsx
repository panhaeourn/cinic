import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Building2,
  CreditCard,
  Image,
  KeyRound,
  Save,
} from 'lucide-react'

import { useClinicBrand } from '../../../shared/clinic/clinicBrand'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { settingsApi } from '../services/settingsApi'
import type { ClinicSettings, ClinicSettingsPayload } from '../types/settings'

const emptySettings: ClinicSettingsPayload = {
  clinicName: '',
  logoUrl: '',
  address: '',
  phone: '',
  email: '',
  currency: 'USD',
  invoicePrefix: 'INV',
  googleClientId: '',
  googleRedirectUri: '',
  bakongAccountId: '',
  bakongMerchantName: '',
  bakongMerchantCity: 'Phnom Penh',
  bakongAccountInformation: '',
  bakongCurrency: 'USD',
  notificationsEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
}

function toPayload(settings: ClinicSettings): ClinicSettingsPayload {
  const { updatedAt: _updatedAt, ...payload } = settings
  return payload
}

export function SettingsPage() {
  const { applyBrand } = useClinicBrand()
  const [form, setForm] = useState<ClinicSettingsPayload>(emptySettings)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const logoPreview = useMemo(() => form.logoUrl.trim(), [form.logoUrl])

  async function loadSettings() {
    setIsLoading(true)
    setError(null)
    try {
      const settings = await settingsApi.get()
      setForm(toPayload(settings))
      setUpdatedAt(settings.updatedAt)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load settings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  function updateField<K extends keyof ClinicSettingsPayload>(key: K, value: ClinicSettingsPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setNotice(null)
    try {
      const saved = await settingsApi.update(form)
      setForm(toPayload(saved))
      setUpdatedAt(saved.updatedAt)
      applyBrand({
        clinicName: saved.clinicName,
        logoUrl: saved.logoUrl,
        currency: saved.currency,
        invoicePrefix: saved.invoicePrefix,
        bakongMerchantName: saved.bakongMerchantName,
        bakongCurrency: saved.bakongCurrency,
      })
      setNotice('Settings saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="settings-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Clinic configuration</span>
          <h1>Settings</h1>
        </div>
          <div className="header-actions">
          <StatusBadge tone="success">Admin only</StatusBadge>
          <span>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : 'Not saved yet'}</span>
        </div>
      </header>

      <div className="billing-command-row settings-command-row">
        <article>
          <span className="command-icon">
            <Building2 size={17} aria-hidden="true" />
          </span>
          <strong>Clinic profile</strong>
          <small>Name, address, contact, and logo reference.</small>
        </article>
        <article>
          <span className="command-icon">
            <CreditCard size={17} aria-hidden="true" />
          </span>
          <strong>Billing setup</strong>
          <small>Currency and invoice prefix controls.</small>
        </article>
        <article>
          <span className="command-icon">
            <KeyRound size={17} aria-hidden="true" />
          </span>
          <strong>OAuth and KHQR</strong>
          <small>Google and Bakong public configuration values.</small>
        </article>
        <article>
          <span className="command-icon">
            <Bell size={17} aria-hidden="true" />
          </span>
          <strong>Notifications</strong>
          <small>Enable clinic notification preferences.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      {isLoading ? (
        <section className="billing-list-card">
          <div className="patient-empty">Loading settings...</div>
        </section>
      ) : (
        <section className="settings-workspace">
          <div className="settings-main-column">
            <article className="settings-card settings-profile-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Profile</span>
                  <h2>Clinic profile</h2>
                </div>
                <Building2 size={20} aria-hidden="true" />
              </div>
              <div className="settings-form-grid">
                <label>
                  <span>Clinic name</span>
                  <input value={form.clinicName} onChange={(event) => updateField('clinicName', event.target.value)} />
                </label>
                <label>
                  <span>Logo URL</span>
                  <input value={form.logoUrl} onChange={(event) => updateField('logoUrl', event.target.value)} />
                </label>
                <label>
                  <span>Phone</span>
                  <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                </label>
                <label className="settings-wide-field">
                  <span>Address</span>
                  <textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} />
                </label>
              </div>
              <div className="settings-logo-preview">
                <span className="command-icon">
                  <Image size={17} aria-hidden="true" />
                </span>
                {logoPreview ? <img alt="Clinic logo preview" src={logoPreview} /> : <span>No logo preview</span>}
              </div>
            </article>

            <article className="settings-card settings-wide-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Notifications</span>
                  <h2>Notification preferences</h2>
                </div>
                <Bell size={20} aria-hidden="true" />
              </div>
              <div className="settings-toggle-grid">
                <label>
                  <input
                    checked={form.notificationsEnabled}
                    type="checkbox"
                    onChange={(event) => updateField('notificationsEnabled', event.target.checked)}
                  />
                  <span>Enable notifications</span>
                </label>
                <label>
                  <input
                    checked={form.emailNotifications}
                    type="checkbox"
                    onChange={(event) => updateField('emailNotifications', event.target.checked)}
                  />
                  <span>Email notifications</span>
                </label>
                <label>
                  <input
                    checked={form.smsNotifications}
                    type="checkbox"
                    onChange={(event) => updateField('smsNotifications', event.target.checked)}
                  />
                  <span>SMS notifications</span>
                </label>
              </div>
              <button className="primary-action settings-save-action" disabled={isSaving} onClick={handleSave} type="button">
                <Save size={17} aria-hidden="true" />
                {isSaving ? 'Saving settings...' : 'Save settings'}
              </button>
            </article>
          </div>

          <div className="settings-side-column">
            <article className="settings-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Billing</span>
                  <h2>Invoice and currency</h2>
                </div>
                <CreditCard size={20} aria-hidden="true" />
              </div>
              <div className="settings-form-grid">
                <label>
                  <span>Currency</span>
                  <input value={form.currency} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} />
                </label>
                <label>
                  <span>Invoice prefix</span>
                  <input value={form.invoicePrefix} onChange={(event) => updateField('invoicePrefix', event.target.value.toUpperCase())} />
                </label>
              </div>
            </article>

            <article className="settings-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">OAuth</span>
                  <h2>Google OAuth config</h2>
                </div>
                <KeyRound size={20} aria-hidden="true" />
              </div>
              <div className="settings-form-grid">
                <label className="settings-wide-field">
                  <span>Google client ID</span>
                  <input value={form.googleClientId} onChange={(event) => updateField('googleClientId', event.target.value)} />
                </label>
                <label className="settings-wide-field">
                  <span>Redirect URI</span>
                  <input value={form.googleRedirectUri} onChange={(event) => updateField('googleRedirectUri', event.target.value)} />
                </label>
              </div>
            </article>

            <article className="settings-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Bakong KHQR</span>
                  <h2>Merchant config</h2>
                </div>
                <CreditCard size={20} aria-hidden="true" />
              </div>
              <div className="settings-form-grid">
                <label>
                  <span>Bakong account ID</span>
                  <input value={form.bakongAccountId} onChange={(event) => updateField('bakongAccountId', event.target.value)} />
                </label>
                <label>
                  <span>Merchant name</span>
                  <input value={form.bakongMerchantName} onChange={(event) => updateField('bakongMerchantName', event.target.value)} />
                </label>
                <label>
                  <span>Merchant city</span>
                  <input value={form.bakongMerchantCity} onChange={(event) => updateField('bakongMerchantCity', event.target.value)} />
                </label>
                <label>
                  <span>Bakong currency</span>
                  <input value={form.bakongCurrency} onChange={(event) => updateField('bakongCurrency', event.target.value.toUpperCase())} />
                </label>
                <label className="settings-wide-field">
                  <span>Account information</span>
                  <input
                    value={form.bakongAccountInformation}
                    onChange={(event) => updateField('bakongAccountInformation', event.target.value)}
                  />
                </label>
              </div>
            </article>
          </div>
        </section>
      )}
    </section>
  )
}
