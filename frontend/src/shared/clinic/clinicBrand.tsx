import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { apiRequest } from '../api/apiClient'
import { normalizeCurrencyCode } from './currency'

export type ClinicBrand = {
  clinicName: string
  logoUrl: string
  currency: string
  invoicePrefix: string
  bakongMerchantName: string
  bakongCurrency: string
}

const defaultClinicBrand: ClinicBrand = {
  clinicName: 'MediFlex',
  logoUrl: '',
  currency: 'USD',
  invoicePrefix: 'INV',
  bakongMerchantName: 'MediFlex Clinic Payment',
  bakongCurrency: 'USD',
}

type ClinicBrandContextValue = {
  brand: ClinicBrand
  isLoading: boolean
  applyBrand: (nextBrand: Partial<ClinicBrand>) => void
  refreshBrand: () => Promise<void>
}

const ClinicBrandContext = createContext<ClinicBrandContextValue | null>(null)

function normalizeBrand(nextBrand: Partial<ClinicBrand> | null | undefined): ClinicBrand {
  const clinicName = nextBrand?.clinicName?.trim() || defaultClinicBrand.clinicName
  return {
    clinicName,
    logoUrl: nextBrand?.logoUrl?.trim() || '',
    currency: normalizeCurrencyCode(nextBrand?.currency, defaultClinicBrand.currency),
    invoicePrefix: nextBrand?.invoicePrefix?.trim().toUpperCase() || defaultClinicBrand.invoicePrefix,
    bakongMerchantName: nextBrand?.bakongMerchantName?.trim() || `${clinicName} Payment`,
    bakongCurrency: normalizeCurrencyCode(nextBrand?.bakongCurrency, defaultClinicBrand.bakongCurrency),
  }
}

async function fetchBrand() {
  const response = await apiRequest<ClinicBrand>('/settings/brand')
  return normalizeBrand(response)
}

export function ClinicBrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<ClinicBrand>(defaultClinicBrand)
  const [isLoading, setIsLoading] = useState(true)

  async function refreshBrand() {
    try {
      const nextBrand = await fetchBrand()
      setBrand(nextBrand)
    } catch {
      setBrand((current) => normalizeBrand(current))
    } finally {
      setIsLoading(false)
    }
  }

  function applyBrand(nextBrand: Partial<ClinicBrand>) {
    setBrand((current) => normalizeBrand({ ...current, ...nextBrand }))
  }

  useEffect(() => {
    void refreshBrand()
  }, [])

  const value = useMemo(
    () => ({
      brand,
      isLoading,
      applyBrand,
      refreshBrand,
    }),
    [brand, isLoading],
  )

  return <ClinicBrandContext.Provider value={value}>{children}</ClinicBrandContext.Provider>
}

export function useClinicBrand() {
  const context = useContext(ClinicBrandContext)
  if (!context) {
    throw new Error('useClinicBrand must be used within ClinicBrandProvider.')
  }
  return context
}
