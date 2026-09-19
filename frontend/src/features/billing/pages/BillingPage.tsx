import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { toDataURL } from 'qrcode'
import {
  BadgeDollarSign,
  CheckCircle2,
  Clipboard,
  CreditCard,
  Download,
  FilePlus2,
  FileText,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react'

import { useClinicBrand } from '../../../shared/clinic/clinicBrand'
import { formatCurrencyAmount } from '../../../shared/clinic/currency'
import { patientApi } from '../../patients/services/patientApi'
import type { Patient } from '../../patients/types/patient'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { billingApi } from '../services/billingApi'
import { downloadReceipt, printReceipt } from '../services/receiptTools'
import type { BakongQr, Invoice, InvoiceItemPayload, InvoiceItemType, InvoiceStatus, PaymentMethod, ServicePrice } from '../types/billing'

type InvoiceItemForm = {
  itemType: InvoiceItemType
  description: string
  quantity: string
  unitPrice: string
}

type PaymentForm = {
  method: PaymentMethod
  amount: string
  referenceNumber: string
  note: string
}

const emptyItem: InvoiceItemForm = {
  itemType: 'CONSULTATION',
  description: 'Consultation fee',
  quantity: '1',
  unitPrice: '',
}

const emptyPayment: PaymentForm = {
  method: 'CASH',
  amount: '',
  referenceNumber: '',
  note: '',
}

const statusTone: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'danger'> = {
  ISSUED: 'info',
  PARTIALLY_PAID: 'default',
  PAID: 'success',
  CANCELLED: 'danger',
}

function parseMoney(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function toInvoiceItemPayload(item: InvoiceItemForm): InvoiceItemPayload {
  return {
    itemType: item.itemType,
    description: item.description.trim(),
    quantity: parseMoney(item.quantity),
    unitPrice: parseMoney(item.unitPrice),
  }
}

export function BillingPage() {
  const { brand } = useClinicBrand()
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const [items, setItems] = useState<InvoiceItemForm[]>([emptyItem])
  const [discountAmount, setDiscountAmount] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState<PaymentForm>(emptyPayment)
  const [khqr, setKhqr] = useState<BakongQr | null>(null)
  const [khqrImage, setKhqrImage] = useState('')
  const [khqrRemainingSeconds, setKhqrRemainingSeconds] = useState(0)
  const [khqrPollMessage, setKhqrPollMessage] = useState('')
  const [khqrConfirmed, setKhqrConfirmed] = useState(false)
  const [isSavingInvoice, setIsSavingInvoice] = useState(false)
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [isGeneratingKhqr, setIsGeneratingKhqr] = useState(false)
  const [isCheckingKhqr, setIsCheckingKhqr] = useState(false)
  const [mutationError, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const khqrPollRef = useRef<number | null>(null)
  const khqrTimerRef = useRef<number | null>(null)
  const khqrPollInFlightRef = useRef(false)
  const khqrAutoRecordRef = useRef(false)
  const money = useCallback((value: number) => formatCurrencyAmount(value, brand.currency), [brand.currency])
  const khqrMerchantName = brand.bakongMerchantName?.trim() || `${brand.clinicName} Payment`

  const draftSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + parseMoney(item.quantity) * parseMoney(item.unitPrice), 0),
    [items],
  )
  const draftTotal = Math.max(0, draftSubtotal - parseMoney(discountAmount) + parseMoney(taxAmount))
  const canPaySelectedInvoice = Boolean(selectedInvoice && selectedInvoice.balanceAmount > 0 && selectedInvoice.status !== 'CANCELLED')
  const showKhqrPanel = payment.method === 'BAKONG_KHQR'
  const khqrAmount = parseMoney(payment.amount || String(selectedInvoice?.balanceAmount ?? 0))
  const canGenerateKhqr = khqrAmount > 0

  const clearKhqrTimers = useCallback(() => {
    if (khqrPollRef.current) {
      window.clearInterval(khqrPollRef.current)
      khqrPollRef.current = null
    }
    if (khqrTimerRef.current) {
      window.clearInterval(khqrTimerRef.current)
      khqrTimerRef.current = null
    }
    khqrPollInFlightRef.current = false
  }, [])

  const client = useQueryClient()
  const invoiceQuery = useQuery({ queryKey: ['invoices', 'list', invoiceSearch, statusFilter], queryFn: () => billingApi.list(invoiceSearch, statusFilter) })
  const patientQuery = useQuery({ queryKey: ['patients', 'billing-options', patientSearch], queryFn: () => patientApi.list(patientSearch) })
  const serviceQuery = useQuery({ queryKey: ['billing-services', serviceSearch], queryFn: () => billingApi.listServices(serviceSearch, true) })
  const invoiceDetail = useQuery({ queryKey: ['invoices', 'detail', selectedInvoice?.id], queryFn: () => billingApi.get(selectedInvoice!.id), enabled: Boolean(selectedInvoice) })
  const invoices = invoiceQuery.data?.content ?? []
  const patients = patientQuery.data?.content ?? []
  const services = serviceQuery.data?.content ?? []
  const totalElements = invoiceQuery.data?.totalElements ?? 0
  const isLoadingInvoices = invoiceQuery.isPending
  const isLoadingPatients = patientQuery.isPending
  const isLoadingServices = serviceQuery.isPending
  const error = mutationError ?? invoiceQuery.error?.message ?? patientQuery.error?.message ?? serviceQuery.error?.message ?? invoiceDetail.error?.message
  useEffect(() => {
    if (invoiceDetail.data?.id === selectedInvoice?.id && invoiceDetail.data) setSelectedInvoice(invoiceDetail.data)
  }, [invoiceDetail.data, selectedInvoice?.id])

  useEffect(() => {
    clearKhqrTimers()
    setKhqr(null)
    setKhqrImage('')
    setKhqrRemainingSeconds(0)
    setKhqrPollMessage('')
    setKhqrConfirmed(false)
    khqrAutoRecordRef.current = false
  }, [clearKhqrTimers, selectedInvoice?.id, payment.method, payment.amount])

  useEffect(() => clearKhqrTimers, [clearKhqrTimers])

  useEffect(() => {
    if (!khqr?.md5 || khqrConfirmed) {
      return
    }

    clearKhqrTimers()

    khqrTimerRef.current = window.setInterval(() => {
      setKhqrRemainingSeconds((current) => {
        if (current <= 1) {
          if (khqrTimerRef.current) {
            window.clearInterval(khqrTimerRef.current)
            khqrTimerRef.current = null
          }
          setKhqrPollMessage('QR expired. Generate a new KHQR.')
          return 0
        }
        return current - 1
      })
    }, 1000)

    const pollBakong = async () => {
      if (khqrPollInFlightRef.current || Date.now() >= khqr.expiresAt) {
        return
      }

      try {
        khqrPollInFlightRef.current = true
        setIsCheckingKhqr(true)
        setKhqrPollMessage('Checking payment automatically...')

        const response = await billingApi.checkBakongMd5(khqr.md5)
        const paid = response.paid === true || response.status === 'PAID'

        if (paid) {
          clearKhqrTimers()
          setKhqrConfirmed(true)
          setKhqrPollMessage('Payment confirmed by Bakong.')
          if (selectedInvoice && !khqrAutoRecordRef.current) {
            khqrAutoRecordRef.current = true
            if (khqr.amount > selectedInvoice.balanceAmount) {
              setNotice('Bakong payment confirmed, but the amount is higher than this invoice balance. Select the correct invoice before recording it.')
              return
            }
            setIsSavingPayment(true)
            try {
              await billingApi.recordPayment(selectedInvoice.id, {
                method: 'BAKONG_KHQR',
                amount: khqr.amount,
                referenceNumber: khqr.md5,
                note: `Bakong KHQR confirmed for ${selectedInvoice.invoiceNumber}`,
              })
              const updatedInvoice = await billingApi.get(selectedInvoice.id)
              setSelectedInvoice(updatedInvoice)
              setPayment({ ...emptyPayment, amount: updatedInvoice.balanceAmount > 0 ? String(updatedInvoice.balanceAmount) : '' })
              await refreshInvoices(updatedInvoice)
              setNotice(`Bakong payment confirmed and recorded for ${updatedInvoice.invoiceNumber}.`)
            } finally {
              setIsSavingPayment(false)
            }
          } else {
            setNotice(selectedInvoice ? 'Bakong payment confirmed.' : 'Bakong payment confirmed. Select an invoice before recording it.')
          }
          return
        }

        if (response.verificationBlocked || response.status === 'VERIFY_BLOCKED') {
          clearKhqrTimers()
          setKhqrPollMessage(response.message || 'Bakong verification is blocked right now.')
          return
        }

        setKhqrPollMessage('Waiting for payment...')
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : ''
        if (message.toLowerCase().includes('token') || message.toLowerCase().includes('denied') || message.toLowerCase().includes('blocked')) {
          clearKhqrTimers()
          setKhqrPollMessage(message)
          return
        }
        setKhqrPollMessage('Checking payment automatically...')
      } finally {
        khqrPollInFlightRef.current = false
        setIsCheckingKhqr(false)
      }
    }

    void pollBakong()
    khqrPollRef.current = window.setInterval(() => {
      void pollBakong()
    }, 3000)

    return () => {
      clearKhqrTimers()
    }
  }, [clearKhqrTimers, khqr, khqrConfirmed, selectedInvoice])

  async function refreshInvoices(nextSelected?: Invoice) {
    await client.invalidateQueries({ queryKey: ['invoices'] })
    if (nextSelected) {
      client.setQueryData(['invoices', 'detail', nextSelected.id], nextSelected)
      setSelectedInvoice(nextSelected)
      setPayment((current) => ({ ...current, amount: nextSelected.balanceAmount > 0 ? String(nextSelected.balanceAmount) : '' }))
    }
  }

  function updateItem(index: number, field: keyof InvoiceItemForm, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }
        return {
          ...item,
          [field]: field === 'itemType' ? (value as InvoiceItemType) : value,
        }
      }),
    )
  }

  function addItem() {
    setItems((current) => [...current, { ...emptyItem, description: '' }])
  }

  function addService(service: ServicePrice) {
    const nextItem: InvoiceItemForm = {
      itemType: service.itemType,
      description: service.name,
      quantity: '1',
      unitPrice: String(service.price),
    }
    setItems((current) => {
      const blankIndex = current.findIndex((item) => !item.description.trim() || (parseMoney(item.quantity) === 0 && parseMoney(item.unitPrice) === 0))
      if (blankIndex === -1) {
        return [...current, nextItem]
      }
      return current.map((item, index) => (index === blankIndex ? nextItem : item))
    })
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)))
  }

  function selectInvoice(invoice: Invoice) {
    setSelectedInvoice(invoice)
    setPayment({ ...emptyPayment, amount: invoice.balanceAmount > 0 ? String(invoice.balanceAmount) : '' })
    setKhqr(null)
    setKhqrImage('')
    setError(null)
    setNotice(null)
  }

  function startNewInvoice() {
    setSelectedInvoice(null)
    setSelectedPatient(null)
    setPatientSearch('')
    setItems([emptyItem])
    setDiscountAmount('')
    setTaxAmount('')
    setNotes('')
    setPayment(emptyPayment)
    setKhqr(null)
    setKhqrImage('')
    setError(null)
    setNotice(null)
  }

  async function handleGenerateKhqr() {
    setError(null)
    setNotice(null)

    const amount = parseMoney(payment.amount || String(selectedInvoice?.balanceAmount ?? 0))
    if (amount <= 0) {
      setError('KHQR amount must be greater than zero.')
      return
    }

    setIsGeneratingKhqr(true)
    try {
      clearKhqrTimers()
      const response = await billingApi.generateBakongKhqr(amount)
      const image = await toDataURL(response.qr, {
        margin: 1,
        width: 220,
        color: {
          dark: '#1f3141',
          light: '#ffffff',
        },
      })
      setKhqr(response)
      setKhqrImage(image)
      setKhqrConfirmed(false)
      setKhqrRemainingSeconds(Math.max(0, Math.ceil((response.expiresAt - Date.now()) / 1000)))
      setKhqrPollMessage('Waiting for payment...')
      setPayment((current) => ({
        ...current,
        method: 'BAKONG_KHQR',
        referenceNumber: response.md5,
        note: current.note || (selectedInvoice ? `Bakong KHQR for ${selectedInvoice.invoiceNumber}` : 'Bakong KHQR manual payment'),
      }))
      setNotice('Bakong KHQR generated. Scan it, then check or record the payment after confirmation.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to generate Bakong KHQR.')
    } finally {
      setIsGeneratingKhqr(false)
    }
  }

  async function handleCopyKhqr() {
    if (!khqr) {
      return
    }
    try {
      await navigator.clipboard.writeText(khqr.qr)
      setNotice('KHQR text copied.')
    } catch {
      setError('Unable to copy KHQR text from this browser.')
    }
  }

  async function handleCheckKhqr() {
    if (!khqr) {
      setError('Generate KHQR before checking Bakong status.')
      return
    }
    setIsCheckingKhqr(true)
    setError(null)
    setNotice(null)
    try {
      const response = await billingApi.checkBakongMd5(khqr.md5)
      const paid = response.paid === true || response.status === 'PAID'
      if (paid) {
        clearKhqrTimers()
        setKhqrConfirmed(true)
        setKhqrPollMessage('Payment confirmed by Bakong.')
        if (selectedInvoice && !khqrAutoRecordRef.current) {
          khqrAutoRecordRef.current = true
          if (khqr.amount > selectedInvoice.balanceAmount) {
            setNotice('Bakong payment confirmed, but the amount is higher than this invoice balance. Select the correct invoice before recording it.')
            return
          }
          setIsSavingPayment(true)
          try {
            await billingApi.recordPayment(selectedInvoice.id, {
              method: 'BAKONG_KHQR',
              amount: khqr.amount,
              referenceNumber: khqr.md5,
              note: `Bakong KHQR confirmed for ${selectedInvoice.invoiceNumber}`,
            })
            const updatedInvoice = await billingApi.get(selectedInvoice.id)
            setSelectedInvoice(updatedInvoice)
            setPayment({ ...emptyPayment, amount: updatedInvoice.balanceAmount > 0 ? String(updatedInvoice.balanceAmount) : '' })
            await refreshInvoices(updatedInvoice)
            setNotice(`Bakong payment confirmed and recorded for ${updatedInvoice.invoiceNumber}.`)
          } finally {
            setIsSavingPayment(false)
          }
        } else {
          setNotice(selectedInvoice ? 'Bakong payment confirmed.' : 'Bakong payment confirmed. Select an invoice before recording it.')
        }
      } else {
        setKhqrPollMessage('Waiting for payment...')
        setNotice('Bakong has not confirmed this payment yet.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to check Bakong payment.')
    } finally {
      setIsCheckingKhqr(false)
    }
  }

  async function handleCreateInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!selectedPatient) {
      setError('Select a patient before creating an invoice.')
      return
    }

    const payloadItems = items.map(toInvoiceItemPayload)
    if (payloadItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Each invoice item needs a description, quantity, and valid unit price.')
      return
    }

    setIsSavingInvoice(true)
    try {
      const invoice = await billingApi.create({
        patientId: selectedPatient.id,
        items: payloadItems,
        discountAmount: parseMoney(discountAmount),
        taxAmount: parseMoney(taxAmount),
        notes,
      })
      setNotice(`Invoice ${invoice.invoiceNumber} created for ${invoice.patientName}.`)
      setSelectedInvoice(invoice)
      setPayment({ ...emptyPayment, amount: invoice.balanceAmount > 0 ? String(invoice.balanceAmount) : '' })
      await refreshInvoices(invoice)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create invoice.')
    } finally {
      setIsSavingInvoice(false)
    }
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!selectedInvoice) {
      setError('Select an invoice before recording payment.')
      return
    }

    const amount = parseMoney(payment.amount)
    if (amount <= 0) {
      setError('Payment amount must be greater than zero.')
      return
    }

    setIsSavingPayment(true)
    try {
      await billingApi.recordPayment(selectedInvoice.id, {
        method: payment.method,
        amount,
        referenceNumber: payment.referenceNumber,
        note: payment.note,
      })
      const updatedInvoice = await billingApi.get(selectedInvoice.id)
      setNotice(`Payment recorded for ${updatedInvoice.invoiceNumber}.`)
      setSelectedInvoice(updatedInvoice)
      setPayment({ ...emptyPayment, amount: updatedInvoice.balanceAmount > 0 ? String(updatedInvoice.balanceAmount) : '' })
      await refreshInvoices(updatedInvoice)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to record payment.')
    } finally {
      setIsSavingPayment(false)
    }
  }

  async function handleReceiptPreview(action: 'notice' | 'print' | 'download' = 'notice') {
    if (!selectedInvoice) {
      return
    }
    setError(null)
    setNotice(null)
    try {
      const receipt = await billingApi.receipt(selectedInvoice.id)
      if (action === 'print') {
        const opened = printReceipt(receipt, { clinicName: brand.clinicName, currency: brand.currency })
        setNotice(opened ? `Receipt opened for ${receipt.invoiceNumber}.` : 'Popup blocked receipt print window.')
      } else if (action === 'download') {
        downloadReceipt(receipt, { clinicName: brand.clinicName, currency: brand.currency })
        setNotice(`Receipt downloaded for ${receipt.invoiceNumber}.`)
      } else {
        setNotice(`Receipt ready: ${receipt.invoiceNumber} has ${receipt.payments.length} payment record(s).`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Receipt is not available yet.')
    }
  }

  return (
    <section className="billing-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cashier workspace</span>
          <h1>Billing</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">Patient code enabled</StatusBadge>
          <span>PYYYYNNN</span>
        </div>
      </header>

      <div className="billing-command-row">
        <article>
          <span className="command-icon">
            <FilePlus2 size={17} aria-hidden="true" />
          </span>
          <strong>Create invoice</strong>
          <small>Add consultation, medicine, service, or other charge items.</small>
        </article>
        <article>
          <span className="command-icon">
            <WalletCards size={17} aria-hidden="true" />
          </span>
          <strong>Receive payment</strong>
          <small>Record cash, Bakong KHQR, ACLEDA, card, bank, or mobile payments.</small>
        </article>
        <article>
          <span className="command-icon">
            <ReceiptText size={17} aria-hidden="true" />
          </span>
          <strong>Receipt ready</strong>
          <small>Payments generate numbered records for receipt preview.</small>
        </article>
        <article>
          <span className="command-icon">
            <BadgeDollarSign size={17} aria-hidden="true" />
          </span>
          <strong>Balance tracking</strong>
          <small>Invoice status updates automatically after each payment.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <div className="billing-workspace">
        <section className="billing-list-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Invoice registry</span>
              <h2>{totalElements} invoices</h2>
            </div>
            <FileText size={20} aria-hidden="true" />
          </div>

          <div className="billing-filter-row">
            <label className="patient-search">
              <Search size={17} aria-hidden="true" />
              <input
                placeholder="Search patient code or name..."
                value={invoiceSearch}
                onChange={(event) => setInvoiceSearch(event.target.value)}
              />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as InvoiceStatus | '')}>
              <option value="">All status</option>
              <option value="ISSUED">Issued</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="invoice-table">
            <div className="invoice-table-row invoice-table-head">
              <span>Bill date</span>
              <span>Patient</span>
              <span>Status</span>
              <span>Total</span>
              <span>Balance</span>
            </div>
            {isLoadingInvoices ? (
              <div className="patient-empty">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="patient-empty">No invoices found.</div>
            ) : (
              invoices.map((invoice) => (
                <button
                  className={selectedInvoice?.id === invoice.id ? 'invoice-table-row active' : 'invoice-table-row'}
                  key={invoice.id}
                  onClick={() => selectInvoice(invoice)}
                  type="button"
                >
                  <strong>{shortDate(invoice.issuedAt)}</strong>
                  <span>
                    {invoice.patientName}
                    <small>Patient ID {invoice.patientCode}</small>
                  </span>
                  <StatusBadge tone={statusTone[invoice.status]}>{invoice.status.replace('_', ' ')}</StatusBadge>
                  <span>{money(invoice.totalAmount)}</span>
                  <span>{money(invoice.balanceAmount)}</span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="billing-form-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">New invoice</span>
              <h2>Create patient bill</h2>
            </div>
            <button className="secondary-action compact" onClick={startNewInvoice} type="button">
              New
            </button>
          </div>

          <div className="billing-patient-picker">
            <div>
              <span className="eyebrow">Patient</span>
              <h3>{selectedPatient ? selectedPatient.fullName : 'Select billing patient'}</h3>
              <p>{selectedPatient ? `${selectedPatient.patientCode} - ${selectedPatient.phone}` : 'Search by code, name, phone, or email.'}</p>
            </div>
            <UserRoundCheck size={20} aria-hidden="true" />
          </div>

          <label className="patient-search billing-patient-search">
            <Search size={17} aria-hidden="true" />
            <input
              placeholder="Search patient..."
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
            />
          </label>

          <div className="billing-patient-results">
            {isLoadingPatients ? (
              <span>Loading patients...</span>
            ) : patients.length === 0 ? (
              <span>No patients found.</span>
            ) : (
              patients.slice(0, 4).map((patient) => (
                <button
                  className={selectedPatient?.id === patient.id ? 'active' : ''}
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  type="button"
                >
                  <strong>{patient.patientCode}</strong>
                  <span>{patient.fullName}</span>
                </button>
              ))
            )}
          </div>

          <form className="billing-form" onSubmit={handleCreateInvoice}>
            <div className="service-price-panel">
              <div className="billing-items-heading">
                <span>Services and pricing</span>
                <label className="patient-search compact-search">
                  <Search size={15} aria-hidden="true" />
                  <input placeholder="Search service..." value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} />
                </label>
              </div>
              <div className="service-price-list">
                {isLoadingServices ? (
                  <span>Loading services...</span>
                ) : services.length === 0 ? (
                  <span>No services found.</span>
                ) : (
                  services.slice(0, 6).map((service) => (
                    <button key={service.id} onClick={() => addService(service)} type="button">
                      <span>
                        <strong>{service.name}</strong>
                        <small>{service.category}</small>
                      </span>
                      <strong>{money(service.price)}</strong>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="billing-items-heading">
              <span>Invoice items</span>
              <button className="secondary-action compact" onClick={addItem} type="button">
                <Plus size={14} aria-hidden="true" />
                Add item
              </button>
            </div>

            {items.map((item, index) => (
              <div className="billing-item-row" key={`${item.itemType}-${index}`}>
                <label>
                  <span>Type</span>
                  <select value={item.itemType} onChange={(event) => updateItem(index, 'itemType', event.target.value)}>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="MEDICINE">Medicine</option>
                    <option value="SERVICE">Service</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label>
                  <span>Description</span>
                  <input required value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} />
                </label>
                <label>
                  <span>Qty</span>
                  <input
                    min="0.01"
                    required
                    step="0.01"
                    type="number"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                  />
                </label>
                <label>
                  <span>Unit price</span>
                  <input
                    min="0"
                    required
                    step="0.01"
                    type="number"
                    value={item.unitPrice}
                    onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                  />
                </label>
                <button aria-label="Remove invoice item" disabled={items.length === 1} onClick={() => removeItem(index)} type="button">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}

            <div className="billing-adjustments">
              <label>
                <span>Discount</span>
                <input min="0" step="0.01" type="number" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} />
              </label>
              <label>
                <span>Tax</span>
                <input min="0" step="0.01" type="number" value={taxAmount} onChange={(event) => setTaxAmount(event.target.value)} />
              </label>
              <label>
                <span>Estimated total</span>
                <input readOnly value={money(draftTotal)} />
              </label>
            </div>

            <label className="full-span">
              <span>Notes</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>

            <button className="primary-action full-span" disabled={isSavingInvoice} type="submit">
              {isSavingInvoice ? 'Creating invoice...' : 'Create invoice'}
            </button>
          </form>
        </section>

        <section className="billing-summary-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Selected bill</span>
              <h2>{selectedInvoice ? selectedInvoice.patientName : 'No invoice selected'}</h2>
            </div>
            <CreditCard size={20} aria-hidden="true" />
          </div>

          {selectedInvoice ? (
            <>
              <div className="billing-summary-grid">
                <div>
                  <small>Total</small>
                  <strong>{money(selectedInvoice.totalAmount)}</strong>
                </div>
                <div>
                  <small>Paid</small>
                  <strong>{money(selectedInvoice.paidAmount)}</strong>
                </div>
                <div>
                  <small>Balance</small>
                  <strong>{money(selectedInvoice.balanceAmount)}</strong>
                </div>
                <div>
                  <small>Status</small>
                  <StatusBadge tone={statusTone[selectedInvoice.status]}>{selectedInvoice.status.replace('_', ' ')}</StatusBadge>
                </div>
              </div>

              <div className="billing-line-list">
                {selectedInvoice.items.map((item) => (
                  <div key={item.id}>
                    <span>
                      {item.description}
                      <small>{item.itemType}</small>
                    </span>
                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="receipt-action-row">
                <button className="secondary-action compact" onClick={() => handleReceiptPreview('notice')} type="button">
                  <ReceiptText size={16} aria-hidden="true" />
                  Preview
                </button>
                <button className="secondary-action compact" onClick={() => handleReceiptPreview('print')} type="button">
                  <Printer size={16} aria-hidden="true" />
                  Print
                </button>
                <button className="secondary-action compact" onClick={() => handleReceiptPreview('download')} type="button">
                  <Download size={16} aria-hidden="true" />
                  Save
                </button>
              </div>
              <button className="secondary-action full-span" onClick={() => handleReceiptPreview('notice')} type="button">
                <Printer size={16} aria-hidden="true" />
                Receipt preview
              </button>
            </>
          ) : (
            <div className="patient-empty">Select an invoice to view balance and payment history.</div>
          )}
        </section>

        <section className="billing-payment-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Payment</span>
              <h2>Receive payment</h2>
            </div>
            <ReceiptText size={20} aria-hidden="true" />
          </div>

          <form className="billing-form payment-form" onSubmit={handlePayment}>
            <label>
              <span>Method</span>
              <select
                value={payment.method}
                onChange={(event) => {
                  const method = event.target.value as PaymentMethod
                  setPayment((current) => ({ ...current, method }))
                }}
              >
                <option value="CASH">Cash</option>
                <option value="BAKONG_KHQR">Bakong KHQR</option>
                <option value="ACLEDA">ACLEDA</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="MOBILE_PAYMENT">Mobile payment</option>
              </select>
            </label>
            <label>
              <span>Amount</span>
              <input
                min="0.01"
                required
                step="0.01"
                type="number"
                value={payment.amount}
                onChange={(event) => setPayment((current) => ({ ...current, amount: event.target.value }))}
              />
            </label>
            <label>
              <span>Reference</span>
              <input value={payment.referenceNumber} onChange={(event) => setPayment((current) => ({ ...current, referenceNumber: event.target.value }))} />
            </label>
            <label>
              <span>Note</span>
              <input value={payment.note} onChange={(event) => setPayment((current) => ({ ...current, note: event.target.value }))} />
            </label>
            <button className="primary-action full-span" disabled={!canPaySelectedInvoice || isSavingPayment} type="submit">
              {isSavingPayment ? 'Recording payment...' : 'Record payment'}
            </button>
          </form>

          {showKhqrPanel ? (
            <div className="bakong-khqr-panel">
              <div className="bakong-khqr-head">
                <div>
                  <span className="eyebrow">Bakong KHQR</span>
                  <strong>{money(khqrAmount)}</strong>
                </div>
                <button className="secondary-action compact" disabled={isGeneratingKhqr || !canGenerateKhqr} onClick={handleGenerateKhqr} type="button">
                  {isGeneratingKhqr ? 'Generating...' : 'Generate KHQR'}
                </button>
              </div>

              {!canGenerateKhqr ? (
                <div className="patient-empty compact-empty">Enter an amount greater than zero to generate KHQR.</div>
              ) : khqr && khqrImage ? (
                <>
                  <div className="khqr-card" aria-label="Bakong KHQR payment preview">
                    <div className="khqr-header">
                      <strong>KHQR</strong>
                      <span aria-hidden="true" />
                    </div>
                    <div className="khqr-body">
                      <div className="khqr-merchant">{khqrMerchantName}</div>
                      <div className="khqr-amount-row">
                        <strong>
                          {khqrAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </strong>
                        <span>{brand.bakongCurrency}</span>
                      </div>
                      <div className="khqr-divider" />
                      <div className="khqr-image-wrap">
                        <img alt="Bakong KHQR" src={khqrImage} />
                      </div>
                    </div>
                  </div>
                  <div className="bakong-khqr-meta">
                    <span>
                      MD5
                      <strong>{khqr.md5}</strong>
                    </span>
                    <span>
                      Remaining
                      <strong className={khqrRemainingSeconds <= 0 && !khqrConfirmed ? 'danger-text' : ''}>
                        {khqrConfirmed
                          ? 'Paid'
                          : `${Math.floor(khqrRemainingSeconds / 60)}:${String(khqrRemainingSeconds % 60).padStart(2, '0')}`}
                      </strong>
                    </span>
                  </div>
                  <div className={khqrConfirmed ? 'khqr-status paid' : khqrRemainingSeconds <= 0 ? 'khqr-status expired' : 'khqr-status'}>
                    {isCheckingKhqr ? 'Checking payment automatically...' : khqrPollMessage || 'Waiting for payment...'}
                  </div>
                  {!selectedInvoice ? (
                    <div className="khqr-caption">Select an invoice before recording this payment.</div>
                  ) : null}
                  <div className="bakong-khqr-actions">
                    <button className="secondary-action compact" onClick={handleCopyKhqr} type="button">
                      <Clipboard size={15} aria-hidden="true" />
                      Copy KHQR
                    </button>
                    <button className="secondary-action compact" disabled={isCheckingKhqr} onClick={handleCheckKhqr} type="button">
                      <CheckCircle2 size={15} aria-hidden="true" />
                      {isCheckingKhqr ? 'Checking...' : 'Check Bakong'}
                    </button>
                  </div>
                  <div className="khqr-caption">Secure KHQR payment preview</div>
                </>
              ) : isGeneratingKhqr ? (
                <div className="patient-empty compact-empty">Generating QR...</div>
              ) : (
                <div className="patient-empty compact-empty">Generate a KHQR code for this invoice balance.</div>
              )}
            </div>
          ) : null}

          {selectedInvoice?.payments.length ? (
            <div className="billing-payment-list">
              {selectedInvoice.payments.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.paymentNumber}
                    <small>{item.method.replace('_', ' ')}</small>
                  </span>
                  <strong>{money(item.amount)}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}
