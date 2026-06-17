export function normalizeCurrencyCode(value: string | null | undefined, fallback = 'USD') {
  const normalized = value?.trim().toUpperCase()
  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : fallback
}

export function formatCurrencyAmount(value: number, currency: string) {
  const safeCurrency = normalizeCurrencyCode(currency)
  try {
    return new Intl.NumberFormat('en-US', {
      currency: safeCurrency,
      style: 'currency',
    }).format(value)
  } catch {
    return new Intl.NumberFormat('en-US', {
      currency: 'USD',
      style: 'currency',
    }).format(value)
  }
}
