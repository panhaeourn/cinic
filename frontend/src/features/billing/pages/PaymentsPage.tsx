import { useEffect, useMemo, useState } from 'react'
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
  return method.replace('_', ' ')
}

export function PaymentsPage() {
  const { brand } = useClinicBrand()
  const [payments, setPayments] = useState<Payment[]>([])
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const money = useMemo(() => (value: number) => formatCurrencyAmount(value, brand.currency), [brand.currency])

  const totals = useMemo(
    () =>
      payments.reduce(
        (current, payment) => ({
          gross: current.gross + payment.amount,
          refunded: current.refunded + payment.refundedAmount,
          net: current.net + payment.netAmount,
        }),
        { gross: 0, net: 0, refunded: 0 },
      ),
    [payments],
  )

  async function loadPayments() {
    setIsLoading(true)
    setError(null)
    try {
      const page = await billingApi.listPayments(search, method, from, to)
      setPayments(page.content)
      setTotalElements(page.totalElements)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load payments.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, method, from, to])

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
          <strong>{money(totals.gross)}</strong>
        </article>
        <article>
          <RotateCcw size={18} aria-hidden="true" />
          <span>Refunded</span>
          <strong>{money(totals.refunded)}</strong>
        </article>
        <article>
          <ReceiptText size={18} aria-hidden="true" />
          <span>Net payments</span>
          <strong>{money(totals.net)}</strong>
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
