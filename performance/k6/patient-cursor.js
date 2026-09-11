import encoding from 'k6/encoding'
import http from 'k6/http'
import { check } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const targetRps = Number.parseInt(__ENV.TARGET_RPS || '250', 10)
const duration = __ENV.DURATION || '30s'
const email = __ENV.PERF_EMAIL
const password = __ENV.PERF_PASSWORD
const scenarioRate = Math.max(1, Math.floor(targetRps / 3))
const scenarioVUs = Math.max(8, Math.ceil(scenarioRate / 10))
const deepCursor = encoding.b64encode(
  '2025-01-06T18:53:20Z|ffffffff-ffff-ffff-ffff-ffffffffffff',
  'rawurl',
)
let sessionInitialized = false

export const options = {
  noCookiesReset: true,
  scenarios: {
    first_page: {
      executor: 'constant-arrival-rate',
      exec: 'firstPage',
      rate: scenarioRate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: scenarioVUs,
      maxVUs: Math.max(50, scenarioVUs * 4),
    },
    deep_cursor: {
      executor: 'constant-arrival-rate',
      exec: 'deepCursorPage',
      rate: scenarioRate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: scenarioVUs,
      maxVUs: Math.max(50, scenarioVUs * 4),
    },
    indexed_search: {
      executor: 'constant-arrival-rate',
      exec: 'indexedSearch',
      rate: scenarioRate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: scenarioVUs,
      maxVUs: Math.max(50, scenarioVUs * 4),
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250', 'p(99)<500'],
    'http_req_duration{name:patient-first-page}': ['p(95)<250', 'p(99)<500'],
    'http_req_duration{name:patient-deep-cursor}': ['p(95)<250', 'p(99)<500'],
    'http_req_duration{name:patient-search}': ['p(95)<250', 'p(99)<500'],
    dropped_iterations: ['count==0'],
  },
}

function csrfToken() {
  const response = http.get(`${BASE_URL}/api/auth/csrf`, { tags: { name: 'csrf' } })
  check(response, { 'csrf initialized': (result) => result.status === 200 })
  return response.json('token')
}

export function setup() {
  if (!email || !password) throw new Error('PERF_EMAIL and PERF_PASSWORD are required')
  const token = csrfToken()
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
      tags: { name: 'login' },
    },
  )
  check(response, { 'performance login succeeded': (result) => result.status === 200 })
  return { sessionId: response.cookies.JSESSIONID?.[0]?.value }
}

function ensureSession(sessionId) {
  if (!sessionInitialized) {
    http.cookieJar().set(BASE_URL, 'JSESSIONID', sessionId, { path: '/' })
    sessionInitialized = true
  }
}

function getPatientPage(sessionId, path, name) {
  ensureSession(sessionId)
  const response = http.get(`${BASE_URL}${path}`, { tags: { name } })
  check(response, { 'patient cursor response is valid': (result) => result.status === 200 })
}

export function firstPage({ sessionId }) {
  getPatientPage(sessionId, '/api/patients/cursor?size=50', 'patient-first-page')
}

export function deepCursorPage({ sessionId }) {
  getPatientPage(
    sessionId,
    `/api/patients/cursor?size=50&cursor=${deepCursor}`,
    'patient-deep-cursor',
  )
}

export function indexedSearch({ sessionId }) {
  getPatientPage(sessionId, '/api/patients/cursor?size=50&search=Patient9999', 'patient-search')
}
