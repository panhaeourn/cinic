import { env } from '../config/env'
import { tokenStorage } from '../../features/auth/services/tokenStorage'

type ApiError = {
  message?: string
  error?: string
  status?: number
  path?: string
  title?: string
  detail?: string
  fieldErrors?: Array<{
    field: string
    message: string
  }>
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getAccessToken()
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const responseText = await response.text()
  const parsedBody = responseText ? (safeJsonParse(responseText) as ApiError | T | null) : null

  if (!response.ok) {
    const error = (parsedBody ?? {}) as ApiError
    const fieldError = error.fieldErrors?.[0]
    const message = fieldError
      ? `${fieldError.field}: ${fieldError.message}`
      : error.message ?? error.detail ?? formatSpringError(error) ?? extractErrorMessage(responseText)
    throw new Error(message ?? friendlyHttpError(response.status, response.statusText))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return parsedBody as T
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    const start = value.indexOf('{')
    const end = value.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(value.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function formatSpringError(error: ApiError) {
  if (!error.error && !error.status && !error.title) {
    return undefined
  }
  const status = error.status ? `${error.status} ` : ''
  const path = error.path ? ` on ${error.path}` : ''
  return `${status}${error.error ?? error.title ?? 'Server error'}${path}`
}

function extractErrorMessage(value: string) {
  if (!value) {
    return undefined
  }
  const messageMatch = value.match(/"message"\s*:\s*"([^"]+)"/)
  if (messageMatch?.[1]) {
    return messageMatch[1]
  }
  const detailMatch = value.match(/"detail"\s*:\s*"([^"]+)"/)
  if (detailMatch?.[1]) {
    return detailMatch[1]
  }
  const errorMatch = value.match(/"error"\s*:\s*"([^"]+)"/)
  const titleMatch = value.match(/"title"\s*:\s*"([^"]+)"/)
  const statusMatch = value.match(/"status"\s*:\s*(\d+)/)
  if (errorMatch?.[1]) {
    return `${statusMatch?.[1] ? `${statusMatch[1]} ` : ''}${errorMatch[1]}`
  }
  if (titleMatch?.[1]) {
    return `${statusMatch?.[1] ? `${statusMatch[1]} ` : ''}${titleMatch[1]}`
  }
  return undefined
}

function friendlyHttpError(status: number, statusText: string) {
  if (status === 401) {
    return 'Please sign in again.'
  }
  if (status === 403) {
    return 'You do not have permission to access this page.'
  }
  if (status === 404) {
    return 'This API is not available yet. Restart the backend if it was just added.'
  }
  if (status >= 500) {
    return 'The backend returned a server error. Check the backend console.'
  }
  return `Request failed with status ${status}${statusText ? ` ${statusText}` : ''}`
}
