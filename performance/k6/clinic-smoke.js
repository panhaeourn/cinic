import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const targetRps = Number.parseInt(__ENV.TARGET_RPS || '100', 10)
const duration = __ENV.DURATION || '30s'
const requestsPerIteration = 2
const iterationRate = Math.max(1, Math.ceil(targetRps / requestsPerIteration))
const preAllocatedVUs = Number.parseInt(
  __ENV.PREALLOCATED_VUS || String(Math.max(12, Math.ceil(targetRps / 20))),
  10,
)
const maxVUs = Number.parseInt(
  __ENV.MAX_VUS || String(Math.max(preAllocatedVUs, Math.ceil(targetRps / 5))),
  10,
)
const email = `performance.${Date.now()}@example.com`
const password = 'Performance1!'
let authenticated = false

export const options = {
  noCookiesReset: true,
  scenarios: {
    clinic_budget: {
      executor: 'constant-arrival-rate',
      rate: iterationRate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs,
      maxVUs,
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250', 'p(99)<500'],
    'http_req_duration{name:session}': ['p(95)<250', 'p(99)<500'],
    'http_req_duration{name:brand}': ['p(95)<250', 'p(99)<500'],
    dropped_iterations: ['count==0'],
  },
}

function csrfToken() {
  const response = http.get(`${BASE_URL}/api/auth/csrf`, { tags: { name: 'csrf' } })
  check(response, { 'csrf initialized': (result) => result.status === 200 })
  return response.json('token')
}

export function setup() {
  const token = csrfToken()
  const response = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ fullName: 'Performance User', email, password }),
    {
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
      tags: { name: 'register' },
    },
  )
  check(response, { 'performance user registered': (result) => result.status === 201 })
  const sessionId = response.cookies.JSESSIONID?.[0]?.value
  return { email, password, sessionId }
}

function ensureAuthenticated(credentials) {
  if (authenticated) return
  if (credentials.sessionId) {
    http.cookieJar().set(BASE_URL, 'JSESSIONID', credentials.sessionId, { path: '/' })
    authenticated = true
    return
  }
  const token = csrfToken()
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(credentials),
    {
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
      tags: { name: 'login' },
    },
  )
  authenticated = check(response, { 'session login succeeded': (result) => result.status === 200 })
}

export default function (credentials) {
  ensureAuthenticated(credentials)
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/auth/me`, null, { tags: { name: 'session' } }],
    ['GET', `${BASE_URL}/api/settings/brand`, null, { tags: { name: 'brand' } }],
  ])
  check(responses[0], { 'session is valid': (response) => response.status === 200 })
  check(responses[1], { 'brand is available': (response) => response.status === 200 })
  if (__ENV.PAUSE_SECONDS) sleep(Number(__ENV.PAUSE_SECONDS))
}
