export type ClinicSettings = {
  clinicName: string
  logoUrl: string
  address: string
  phone: string
  email: string
  currency: string
  invoicePrefix: string
  googleClientId: string
  googleRedirectUri: string
  bakongAccountId: string
  bakongMerchantName: string
  bakongMerchantCity: string
  bakongAccountInformation: string
  bakongCurrency: string
  notificationsEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  updatedAt: string
}

export type ClinicSettingsPayload = Omit<ClinicSettings, 'updatedAt'>
