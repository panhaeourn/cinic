import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FileImage, GraduationCap, IdCard, Languages, RefreshCcw } from 'lucide-react'

import certificateTemplate from '../../../assets/certificate-template.webp'
import { StatusBadge } from '../../../shared/ui/StatusBadge'

type CertificateForm = {
  recipientName: string
  gender: string
  nationality: string
  birthDate: string
  courseTitle: string
  issueDate: string
  photoDataUrl: string
}

const emptyForm: CertificateForm = {
  recipientName: '',
  gender: '',
  nationality: '',
  birthDate: '',
  courseTitle: '',
  issueDate: '',
  photoDataUrl: '',
}

function previewText(value: string, fallback = '................................') {
  return value.trim() || fallback
}

function formatCertificateDate(value: string) {
  if (!value) {
    return '................................'
  }

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

export function CertificateFormPage() {
  const [form, setForm] = useState<CertificateForm>(emptyForm)

  const birthDatePreview = useMemo(() => formatCertificateDate(form.birthDate), [form.birthDate])
  const issueDatePreview = useMemo(() => formatCertificateDate(form.issueDate), [form.issueDate])

  function updateField(field: keyof CertificateForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setForm(emptyForm)
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      updateField('photoDataUrl', '')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('photoDataUrl', reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="certificates-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Document workspace</span>
          <h1>Certificate Form</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">PDF matched</StatusBadge>
          <span>Single-page landscape certificate</span>
        </div>
      </header>

      <div className="billing-command-row">
        <article>
          <span className="command-icon">
            <IdCard size={17} aria-hidden="true" />
          </span>
          <strong>Recipient details</strong>
          <small>Capture the name, gender, nationality, and date of birth from the certificate request.</small>
        </article>
        <article>
          <span className="command-icon">
            <GraduationCap size={17} aria-hidden="true" />
          </span>
          <strong>Course details</strong>
          <small>Fill the completed course title exactly as it should appear inside the template.</small>
        </article>
        <article>
          <span className="command-icon">
            <Languages size={17} aria-hidden="true" />
          </span>
          <strong>Template aware</strong>
          <small>The preview is aligned to the uploaded PDF design, including both Khmer and English fill points.</small>
        </article>
        <article>
          <span className="command-icon">
            <FileImage size={17} aria-hidden="true" />
          </span>
          <strong>Photo ready</strong>
          <small>Optional portrait upload drops into the dedicated photo box on the final certificate.</small>
        </article>
      </div>

      <div className="certificate-workspace">
        <section className="billing-form-card certificate-form-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Template data</span>
              <h2>Fill the certificate</h2>
            </div>
            <button className="secondary-action compact" onClick={resetForm} type="button">
              <RefreshCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>

          <form className="billing-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Recipient name</span>
              <input
                placeholder="Enter the recipient's full name"
                value={form.recipientName}
                onChange={(event) => updateField('recipientName', event.target.value)}
              />
            </label>

            <label>
              <span>Gender</span>
              <input
                placeholder="Female, Male, or custom"
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
              />
            </label>

            <label>
              <span>Nationality</span>
              <input
                placeholder="Cambodian"
                value={form.nationality}
                onChange={(event) => updateField('nationality', event.target.value)}
              />
            </label>

            <label>
              <span>Date of birth</span>
              <input type="date" value={form.birthDate} onChange={(event) => updateField('birthDate', event.target.value)} />
            </label>

            <label className="full-span">
              <span>Completed course</span>
              <input
                placeholder="Computer basics, office skills, design course..."
                value={form.courseTitle}
                onChange={(event) => updateField('courseTitle', event.target.value)}
              />
            </label>

            <label>
              <span>Issue date</span>
              <input type="date" value={form.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} />
            </label>

            <label className="full-span">
              <span>Recipient photo</span>
              <input accept="image/*" type="file" onChange={handlePhotoChange} />
            </label>
          </form>

          <p className="certificate-helper-copy">
            The live preview on the right uses the exact certificate artwork from your PDF and places the entered details on top
            of the original blank spaces.
          </p>
        </section>

        <section className="billing-list-card certificate-preview-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Live preview</span>
              <h2>Certificate layout</h2>
            </div>
            <StatusBadge tone="info">Aligned to PDF</StatusBadge>
          </div>

          <div className="certificate-preview-shell">
            <div className="certificate-canvas">
              <img alt="Certificate template" className="certificate-template-image" src={certificateTemplate} />

              <div className="certificate-layer">
                <span className="certificate-field certificate-kh-name">{previewText(form.recipientName, '................')}</span>
                <span className="certificate-field certificate-kh-gender">{previewText(form.gender, '........')}</span>
                <span className="certificate-field certificate-kh-nationality">{previewText(form.nationality, '........')}</span>
                <span className="certificate-field certificate-kh-birthdate">{birthDatePreview}</span>
                <span className="certificate-field certificate-kh-course">{previewText(form.courseTitle, '........................')}</span>
                <span className="certificate-field certificate-kh-issue">{issueDatePreview}</span>

                <span className="certificate-field certificate-en-name">{previewText(form.recipientName, '........................')}</span>
                <span className="certificate-field certificate-en-birthdate">{birthDatePreview}</span>
                <span className="certificate-field certificate-en-course">{previewText(form.courseTitle, '........................')}</span>
                <span className="certificate-field certificate-en-issue">{issueDatePreview}</span>

                <div className="certificate-photo-slot">
                  {form.photoDataUrl ? (
                    <img alt="Recipient portrait" className="certificate-photo" src={form.photoDataUrl} />
                  ) : (
                    <div className="certificate-photo-placeholder">
                      <FileImage size={18} aria-hidden="true" />
                      <span>Photo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
