export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  backendBaseUrl:
    import.meta.env.VITE_BACKEND_BASE_URL ??
    (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api').replace(/\/api\/?$/, ''),
} as const
