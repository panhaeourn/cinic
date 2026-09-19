import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  Banknote,
  Download,
  Filter,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  WalletCards,
} from 'lucide-react'

import { useClinicBrand } from '../../../shared/clinic/clinicBrand'
import { formatCurrencyAmount } from '../../../shared/clinic/currency'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { billingApi } from '../services/billingApi'
import { downloadReceipt, printReceipt } from '../services/receiptTools'
import type { Payment, PaymentMethod } from '../types/billing'

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function methodLabel(method: PaymentMethod) {
  return method
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function PaymentsPage() {
  const { brand } = useClinicBrand()
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null)
  const [mutationError, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const money = useMemo(() => (value: number) => formatCurrencyAmount(value, brand.currency), [brand.currency])

  const client = useQueryClient()
  const paymentQuery = useQuery({ queryKey: ['payments', 'list', search, method, from, to], queryFn: () => billingApi.listPayments(search, method, from, to) })
  const summaryQuery = useQuery({ queryKey: ['payments', 'summary', search, method, from, to], queryFn: () => billingApi.paymentSummary(search, method, from, to) })
  const payments = paymentQuery.data?.content ?? []
  const totalElements = paymentQuery.data?.totalElements ?? 0
  const summary = summaryQuery.data ?? { grossAmount: 0, refundedAmount: 0, netAmount: 0, paymentCount: 0 }
  const isLoading = paymentQuery.isPending
  const error = mutationError ?? paymentQuery.error?.message ?? summaryQuery.error?.message
  async function loadPayments() { await client.invalidateQueries({ queryKey: ['payments'] }) }

  async function handleReceipt(payment: Payment, action: 'print' | 'download') {
    setBusyPaymentId(payment.id)
    setError(null)
    setNotice(null)
    try {
      const receipt = await billingApi.receipt(payment.invoiceId)
      if (action === 'print') {
        const opened = printReceipt(receipt, { clinicName: brand.clinicName, currency: brand.currency })
        setNotice(opened ? `Receipt opened for ${receipt.invoiceNumber}.` : 'Popup blocked receipt print window.')
      } else {
        downloadReceipt(receipt, { clinicName: brand.clinicName, currency: brand.currency })
        setNotice(`Receipt downloaded for ${receipt.invoiceNumber}.`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Receipt is not available yet.')
    } finally {
      setBusyPaymentId(null)
    }
  }

  async function handleRefund(payment: Payment) {
    const refundable = Number((payment.amount - payment.refundedAmount).toFixed(2))
    if (refundable <= 0) {
      setError('This payment is already fully refunded.')
      return
    }

    const amountText = window.prompt(`Refund amount for ${payment.paymentNumber}. Maximum ${money(refundable)}.`, String(refundable))
    if (!amountText) {
      return
    }
    const amount = Number(amountText)
    if (!Number.isFinite(amount) || amount <= 0 || amount > refundable) {
      setError('Refund amount must be greater than zero and not exceed the refundable amount.')
      return
    }

    const reason = window.prompt('Refund reason') ?? ''
    setBusyPaymentId(payment.id)
    setError(null)
    setNotice(null)
    try {
      await billingApi.refundPayment(payment.id, { amount, reason })
      setNotice(`Refund recorded for ${payment.paymentNumber}.`)
      await loadPayments()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to refund payment.')
    } finally {
      setBusyPaymentId(null)
    }
  }

  return (
    <section className="payments-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cashier workspace</span>
          <h1>Payments</h1>
        </div>
        <div className="header-actions">
          <StatusBadge tone="success">Receipt ready</StatusBadge>
          <span>{totalElements} records</span>
        </div>
      </header>

      <div className="billing-command-row">
        <article>
          <span className="command-icon">
            <WalletCards size={17} aria-hidden="true" />
          </span>
          <strong>Payment history</strong>
          <small>Search payment, invoice, patient ID, name, or reference.</small>
        </article>
        <article>
          <span className="command-icon">
            <Printer size={17} aria-hidden="true" />
          </span>
          <strong>Receipt print</strong>
          <small>Open a printable receipt directly from each payment row.</small>
        </article>
        <article>
          <span className="command-icon">
            <Download size={17} aria-hidden="true" />
          </span>
          <strong>Receipt download</strong>
          <small>Save receipt text for a selected invoice payment.</small>
        </article>
        <article>
          <span className="command-icon">
            <RotateCcw size={17} aria-hidden="true" />
          </span>
          <strong>Refunds</strong>
          <small>Record partial or full refunds and update invoice balance.</small>
        </article>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {notice ? <div className="success-alert">{notice}</div> : null}

      <section className="payments-summary-grid">
        <article>
          <Banknote size={18} aria-hidden="true" />
          <span>Gross received</span>
          <strong>{money(summary.grossAmount)}</strong>
        </article>
        <article>
          <RotateCcw size={18} aria-hidden="true" />
          <span>Refunded</span>
          <strong>{money(summary.refundedAmount)}</strong>
        </article>
        <article>
          <ReceiptText size={18} aria-hidden="true" />
          <span>Net payments</span>
          <strong>{money(summary.netAmount)}</strong>
        </article>
      </section>

      <section className="billing-list-card payments-list-card">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Payment registry</span>
            <h2>{totalElements} payments</h2>
          </div>
          <Filter size={20} aria-hidden="true" />
        </div>

        <div className="payments-filter-grid">
          <label className="patient-search">
            <Search size={17} aria-hidden="true" />
            <input placeholder="Search payment, invoice, patient, reference..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod | '')}>
            <option value="">All methods</option>
            <option value="CASH">Cash</option>
            <option value="BAKONG_KHQR">Bakong KHQR</option>
            <option value="ACLEDA">ACLEDA</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="MOBILE_PAYMENT">Mobile payment</option>
          </select>
          <input aria-label="From date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input aria-label="To date" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>

        <div className="payments-table">
          <div className="payments-table-row payments-table-head">
            <span>Payment</span>
            <span>Patient</span>
            <span>Method</span>
            <span>Amount</span>
            <span>Refund</span>
            <span>Net</span>
            <span>Actions</span>
          </div>
          {isLoading ? (
            <div className="patient-empty">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="patient-empty">No payments found.</div>
          ) : (
            payments.map((payment) => (
              <div className="payments-table-row" key={payment.id}>
                <span>
                  <strong>{payment.paymentNumber}</strong>
                  <small>{shortDate(payment.paidAt)}</small>
                  <small>{payment.invoiceNumber}</small>
                </span>
                <span>
                  {payment.patientName}
                  <small>Patient ID {payment.patientCode}</small>
                </span>
                <StatusBadge tone="info">{methodLabel(payment.method)}</StatusBadge>
                <span>{money(payment.amount)}</span>
                <span className={payment.refundedAmount > 0 ? 'danger-text' : ''}>{money(payment.refundedAmount)}</span>
                <strong>{money(payment.netAmount)}</strong>
                <div className="row-actions">
                  <button className="secondary-action compact" disabled={busyPaymentId === payment.id} onClick={() => handleReceipt(payment, 'print')} type="button">
                    <Printer size={14} aria-hidden="true" />
                    Print
                  </button>
                  <button className="secondary-action compact" disabled={busyPaymentId === payment.id} onClick={() => handleReceipt(payment, 'download')} type="button">
                    <Download size={14} aria-hidden="true" />
                    Save
                  </button>
                  <button className="secondary-action compact danger" disabled={busyPaymentId === payment.id} onClick={() => handleRefund(payment)} type="button">
                    <RotateCcw size={14} aria-hidden="true" />
                    Refund
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  )
}
