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
          :root {
            color-scheme: light;
            font-family: Inter, Arial, sans-serif;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            padding: 28px;
            color: #213140;
            background:
              radial-gradient(circle at 18% 12%, rgba(255,255,255,0.9), transparent 22%),
              radial-gradient(circle at 82% 18%, rgba(198, 217, 245, 0.38), transparent 24%),
              linear-gradient(180deg, #e6edf6, #d9e4f2);
          }
          body::before {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 34%),
              linear-gradient(180deg, rgba(24, 36, 52, 0.08), rgba(24, 36, 52, 0.02) 24%, rgba(255, 255, 255, 0) 70%);
          }
          .sheet {
            position: relative;
            max-width: 460px;
            margin: 0 auto;
            padding: 22px;
            border: 1px solid rgba(255,255,255,0.88);
            border-radius: 28px;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0.1) 28%, rgba(255,255,255,0.035)),
              linear-gradient(145deg, rgba(179,199,228,0.1), rgba(255,255,255,0.025) 48%, rgba(103,125,160,0.055)),
              rgba(255,255,255,0.22);
            box-shadow:
              0 34px 84px rgba(27, 37, 53, 0.24),
              0 0 0 1px rgba(255,255,255,0.12),
              inset 0 1px 1px rgba(255,255,255,0.98),
              inset 0 -1px 1px rgba(44,58,79,0.1);
            backdrop-filter: blur(28px) saturate(160%) contrast(112%);
          }
          .sheet::before {
            content: "";
            position: absolute;
            inset: 1px;
            border-radius: inherit;
            pointer-events: none;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.28), transparent 18%),
              radial-gradient(circle at 16% 0%, rgba(255,255,255,0.2), transparent 22%);
            mix-blend-mode: screen;
            opacity: 0.8;
          }
          .sheet::after {
            content: "";
            position: absolute;
            inset: -14px;
            z-index: -1;
            border-radius: 42px;
            pointer-events: none;
            background:
              radial-gradient(circle at 50% 18%, rgba(255,255,255,0.24), transparent 34%),
              radial-gradient(circle at 50% 100%, rgba(126, 170, 214, 0.16), transparent 44%);
            filter: blur(18px);
            opacity: 0.92;
          }
          .eyebrow {
            margin: 0 0 6px;
            color: #6a86a4;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
          }
          h1 { margin: 0; font-size: 24px; }
          h2 { margin: 2px 0 18px; color: #607890; font-size: 14px; font-weight: 700; }
          .summary {
            display: grid;
            gap: 10px;
            margin-bottom: 18px;
            padding: 14px;
            border: 1px solid rgba(255,255,255,0.82);
            border-radius: 20px;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08)),
              rgba(255,255,255,0.14);
          }
          .row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid rgba(113, 135, 164, 0.14); }
          .row:last-child { border-bottom: 0; }
          .row span { color: #667987; }
          .row strong { text-align: right; }
          .totals {
            display: grid;
            gap: 10px;
            margin: 18px 0;
          }
          .total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 14px;
            border: 1px solid rgba(255,255,255,0.8);
            border-radius: 18px;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08)),
              rgba(255,255,255,0.12);
            font-size: 18px;
            font-weight: 800;
          }
          table {
            width: 100%;
            margin-top: 8px;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.8);
            border-radius: 20px;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.08)),
              rgba(255,255,255,0.12);
          }
          thead th {
            color: #5d7792;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            background: rgba(255,255,255,0.14);
          }
          th, td { padding: 12px 10px; border-bottom: 1px solid rgba(113, 135, 164, 0.14); text-align: left; }
          tbody tr:last-child td { border-bottom: 0; }
          th:last-child, td:last-child { text-align: right; }
          .footer {
            margin-top: 18px;
            color: #758698;
            font-size: 12px;
            text-align: center;
          }
          @media print {
            body { padding: 0; background: #fff; }
            .sheet {
              box-shadow: none;
              border: 1px solid #dfe6ef;
              background: #fff;
              backdrop-filter: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <p class="eyebrow">${clinicName}</p>
          <h1>Payment receipt</h1>
          <h2>${receipt.invoiceNumber}</h2>
          <div class="summary">
            <div class="row"><span>Patient</span><strong>${receipt.patientName}</strong></div>
            <div class="row"><span>Patient ID</span><strong>${receipt.patientCode}</strong></div>
            <div class="row"><span>Issued</span><strong>${dateTime(receipt.issuedAt)}</strong></div>
          </div>
          <div class="totals">
            <div class="total"><span>Total</span><strong>${money(receipt.totalAmount, currency)}</strong></div>
            <div class="total"><span>Paid</span><strong>${money(receipt.paidAmount, currency)}</strong></div>
            <div class="total"><span>Balance</span><strong>${money(receipt.balanceAmount, currency)}</strong></div>
          </div>
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
                      <td>${payment.method.replace(/_/g, ' ')}</td>
                      <td>${money(payment.netAmount, currency)}</td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">Generated by ${clinicName}</div>
        </div>
      </body>
    </html>
  `)
  printable.document.close()
  printable.focus()
  printable.print()
  return true
}
