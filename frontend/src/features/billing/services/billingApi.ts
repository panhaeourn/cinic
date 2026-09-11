import { apiRequest } from '../../../shared/api/apiClient'
import type {
  BakongCheckResponse,
  BakongQr,
  Invoice,
  InvoiceItemPayload,
  InvoicePayload,
  InvoiceStatus,
  PageResponse,
  Payment,
  PaymentMethod,
  PaymentPayload,
  PaymentRefundPayload,
  PaymentSummary,
  Receipt,
  ServicePrice,
  ServicePricePayload,
} from '../types/billing'

function cleanObject<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== undefined),
  )
}

function cleanInvoicePayload(payload: InvoicePayload) {
  return {
    ...cleanObject(payload),
    items: payload.items.map((item) => cleanObject(item)),
  }
}

function formatTimezoneOffset(date: Date) {
  const minutes = -date.getTimezoneOffset()
  const sign = minutes >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(minutes)
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0')
  const remainder = String(absoluteMinutes % 60).padStart(2, '0')
  return `${sign}${hours}:${remainder}`
}

function formatLocalBoundary(dateValue: string, endOfDay = false) {
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000'
  const localDate = new Date(`${dateValue}T12:00:00`)
  return `${dateValue}T${time}${formatTimezoneOffset(localDate)}`
}

export const billingApi = {
  list(search: string, status: InvoiceStatus | '', patientId?: string) {
    const query = new URLSearchParams({ size: '20', sort: 'createdAt,desc' })
    if (search.trim()) {
      query.set('search', search.trim())
    }
    if (status) {
      query.set('status', status)
    }
    if (patientId) {
      query.set('patientId', patientId)
    }
    return apiRequest<PageResponse<Invoice>>(`/invoices?${query.toString()}`)
  },
  get(id: string) {
    return apiRequest<Invoice>(`/invoices/${id}`)
  },
  create(payload: InvoicePayload) {
    return apiRequest<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(cleanInvoicePayload(payload)),
    })
  },
  addItem(id: string, payload: InvoiceItemPayload) {
    return apiRequest<Invoice>(`/invoices/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(cleanObject(payload)),
    })
  },
  recordPayment(id: string, payload: PaymentPayload) {
    return apiRequest<Payment>(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(cleanObject(payload)),
    })
  },
  receipt(id: string) {
    return apiRequest<Receipt>(`/invoices/${id}/receipt`)
  },
  listPayments(search: string, method: PaymentMethod | '', from?: string, to?: string) {
    const query = new URLSearchParams({ size: '30', sort: 'paidAt,desc' })
    if (search.trim()) {
      query.set('search', search.trim())
    }
    if (method) {
      query.set('method', method)
    }
    if (from) {
      query.set('from', formatLocalBoundary(from))
    }
    if (to) {
      query.set('to', formatLocalBoundary(to, true))
    }
    return apiRequest<PageResponse<Payment>>(`/payments?${query.toString()}`)
  },
  paymentSummary(search: string, method: PaymentMethod | '', from?: string, to?: string) {
    const query = new URLSearchParams()
    if (search.trim()) {
      query.set('search', search.trim())
    }
    if (method) {
      query.set('method', method)
    }
    if (from) {
      query.set('from', formatLocalBoundary(from))
    }
    if (to) {
      query.set('to', formatLocalBoundary(to, true))
    }
    return apiRequest<PaymentSummary>(`/payments/summary?${query.toString()}`)
  },
  refundPayment(id: string, payload: PaymentRefundPayload) {
    return apiRequest<Payment>(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(cleanObject(payload)),
    })
  },
  listServices(search = '', active = true) {
    const query = new URLSearchParams({ size: '40', sort: 'name,asc' })
    if (search.trim()) {
      query.set('search', search.trim())
    }
    query.set('active', String(active))
    return apiRequest<PageResponse<ServicePrice>>(`/billing-services?${query.toString()}`)
  },
  createService(payload: ServicePricePayload) {
    return apiRequest<ServicePrice>('/billing-services', {
      method: 'POST',
      body: JSON.stringify(cleanObject(payload)),
    })
  },
  updateService(id: string, payload: ServicePricePayload) {
    return apiRequest<ServicePrice>(`/billing-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanObject(payload)),
    })
  },
  setServiceActive(id: string, active: boolean) {
    return apiRequest<ServicePrice>(`/billing-services/${id}/active?active=${active}`, {
      method: 'PATCH',
    })
  },
  generateBakongKhqr(amount: number) {
    return apiRequest<BakongQr>('/bakong/qr', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  },
  checkBakongMd5(md5: string) {
    return apiRequest<BakongCheckResponse>('/bakong/check-md5', {
      method: 'POST',
      body: JSON.stringify({ md5 }),
    })
  },
}
