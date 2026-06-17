import type { Receipt } from '../types/billing'
import { formatCurrencyAmount } from '../../../shared/clinic/currency'

type ReceiptRenderOptions = {
  clinicName?: string
  currency?: string
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function money(value: number, currency: string) {
  return formatCurrencyAmount(value, currency)
}

function receiptText(receipt: Receipt, options: ReceiptRenderOptions = {}) {
  const clinicName = options.clinicName?.trim() || 'MediFlex Clinic'
  const currency = options.currency?.trim() || 'USD'
  const lines = [
    clinicName,
    `Receipt for ${receipt.patientName}`,
    `Patient ID: ${receipt.patientCode}`,
    `Invoice: ${receipt.invoiceNumber}`,
    `Issued: ${dateTime(receipt.issuedAt)}`,
    '',
    `Total: ${money(receipt.totalAmount, currency)}`,
    `Paid: ${money(receipt.paidAmount, currency)}`,
    `Balance: ${money(receipt.balanceAmount, currency)}`,
    '',
    'Payments',
    ...receipt.payments.map((payment) => {
      const refund = payment.refundedAmount > 0 ? `, refunded ${money(payment.refundedAmount, currency)}` : ''
      return `${payment.paymentNumber} - ${payment.method.replace('_', ' ')} - ${money(payment.amount, currency)}${refund}`
    }),
  ]

  return lines.join('\n')
}

export function downloadReceipt(receipt: Receipt, options: ReceiptRenderOptions = {}) {
  const blob = new Blob([receiptText(receipt, options)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${receipt.invoiceNumber}-receipt.txt`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function printReceipt(receipt: Receipt, options: ReceiptRenderOptions = {}) {
  const clinicName = options.clinicName?.trim() || 'MediFlex Clinic'
  const currency = options.currency?.trim() || 'USD'
  const printable = window.open('', '_blank', 'width=520,height=720')
  if (!printable) {
    return false
  }

  printable.document.write(`
    <html>
      <head>
        <title>${receipt.invoiceNumber} receipt</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; color: #1f3141; margin: 32px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          h2 { margin: 0 0 24px; color: #5d87a1; font-size: 14px; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5eef3; }
          .total { font-size: 18px; font-weight: 800; }
          table { width: 100%; margin-top: 20px; border-collapse: collapse; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e5eef3; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
        </style>
      </head>
      <body>
        <h1>${clinicName}</h1>
        <h2>Payment receipt</h2>
        <div class="row"><span>Patient</span><strong>${receipt.patientName}</strong></div>
        <div class="row"><span>Patient ID</span><strong>${receipt.patientCode}</strong></div>
        <div class="row"><span>Invoice</span><strong>${receipt.invoiceNumber}</strong></div>
        <div class="row"><span>Issued</span><strong>${dateTime(receipt.issuedAt)}</strong></div>
        <div class="row total"><span>Total</span><strong>${money(receipt.totalAmount, currency)}</strong></div>
        <div class="row total"><span>Paid</span><strong>${money(receipt.paidAmount, currency)}</strong></div>
        <div class="row"><span>Balance</span><strong>${money(receipt.balanceAmount, currency)}</strong></div>
        <table>
          <thead>
            <tr><th>Payment</th><th>Method</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${receipt.payments
              .map(
                (payment) => `
                  <tr>
                    <td>${payment.paymentNumber}</td>
                    <td>${payment.method.replace('_', ' ')}</td>
                    <td>${money(payment.netAmount, currency)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `)
  printable.document.close()
  printable.focus()
  printable.print()
  return true
}
