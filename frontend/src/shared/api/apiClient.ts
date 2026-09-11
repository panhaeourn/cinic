import { env } from '../config/env'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
type CsrfResponse = { headerName: string; token: string }
let csrfRequest: Promise<CsrfResponse> | null = null

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
	const method = (options.method ?? 'GET').toUpperCase()
	const stateChanging = !SAFE_METHODS.has(method)

	for (let attempt = 0; attempt < 2; attempt += 1) {
		const headers = new Headers(options.headers)
		if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json')
		}
		if (stateChanging) {
			const csrf = await getCsrfToken(attempt > 0)
			headers.set(csrf.headerName, csrf.token)
		}

		const response = await fetch(`${env.apiBaseUrl}${path}`, {
			...options,
			credentials: 'include',
			headers,
		})
		const responseText = await response.text()
		const parsedBody = responseText ? (safeJsonParse(responseText) as ApiError | T | null) : null

		if (response.status === 403 && stateChanging && attempt === 0 && !options.signal?.aborted) {
			continue
		}
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

	throw new Error('Request failed after refreshing request security.')
}

async function getCsrfToken(forceRefresh = false) {
	const existing = forceRefresh ? null : readCookie('XSRF-TOKEN')
	if (existing) {
		return { headerName: 'X-XSRF-TOKEN', token: existing }
	}
	csrfRequest ??= fetch(`${env.apiBaseUrl}/auth/csrf`, {
		credentials: 'include',
		headers: { Accept: 'application/json' },
	})
		.then(async (response) => {
			if (!response.ok) {
				throw new Error('Unable to initialize request security.')
			}
			return (await response.json()) as CsrfResponse
		})
		.finally(() => {
			csrfRequest = null
		})
	return csrfRequest
}

function readCookie(name: string) {
	const prefix = `${encodeURIComponent(name)}=`
	const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix))
	return value ? decodeURIComponent(value.slice(prefix.length)) : null
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
