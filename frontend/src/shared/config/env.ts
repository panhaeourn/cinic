export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  backendBaseUrl:
    import.meta.env.VITE_BACKEND_BASE_URL ??
    (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/api\/?$/, ''),
} as const
