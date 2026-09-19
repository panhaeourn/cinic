# Cached clinic screens and live invalidation

All data-backed clinic routes use TanStack Query: Patients, Staff, Appointments, Queue, Vitals, Encounters, Billing, Payments, Reports, Departments, Access Control, Audit Logs and Settings. Brand settings also update in the dashboard and certificate editor. The dashboard illustration/metrics and pharmacy/prescription placeholders remain static; they have no server dataset in this project.

## Transport and cache behavior

- One cookie-authenticated GET /api/events connection per visible signed-in tab. No clinical records or identifiers are sent over this stream, only resource names.
- Successful REST mutations publish after request completion, after transactional services commit. Failed writes, ordinary reads and external Bakong verification calls do not publish.
- The server batches notices every 500 ms, sends a heartbeat every 15 seconds, caps open streams at 256, and expires connections after five minutes. Logout/session invalidation removes connections. The client pauses while hidden/offline, retries with jitter and bounded exponential backoff, and closes on logout/unmount.
- Every new connection sends a sync event. The client reconciles caches after reconnect instead of relying on a durable replay log. Events batch for 200 ms; matching active queries refetch in the background, inactive queries become stale until next used. Existing content stays visible during refetch.
- Normal query freshness remains 30 seconds, with five-minute in-memory cache retention. Patient cursor pagination, virtualization, cancellation and debounced search are preserved. Appointment/queue zero-staleness overrides were removed now that updates invalidate the cache.
- Patient/settings drafts are protected from incoming data; other editor drafts remain local. Selected staff/user summaries and invoice details refresh independently of their forms.
- The exact Nginx /api/events location disables buffering and extends the read timeout. Ordinary API buffering is unchanged.
- Existing Bakong provider verification remains separate: SSE distributes clinic database changes, not provider payment confirmations.

When EventSource fails, the client probes the HTTP status once. Missing or unauthorized endpoints pause retries for five minutes and show an availability notice. This prevents rapid 404 retries during a frontend/backend deployment mismatch. The stream resumes automatically after deployment; this fallback does not repair failed patient writes. Run `node performance/sse-availability.cjs` for the local missing-endpoint regression test.

## Deployment scope

Deploy frontend and backend together. This broker serves the existing single-backend deployment; multiple replicas or external database writers need shared publish/subscribe and after-commit publishing from those writers. No database migration or new production dependency is required. The transport is invalidation, not an audit or durable event log.

## Verification

Run backend/mvnw.cmd -f backend/pom.xml verify. ClinicEventsTests cover authentication, cross-session delivery after a successful write, absence of record data in events, cleanup after session invalidation, and suppression of failed/read requests.

Build and serve the production frontend on localhost:4175, then run NODE_PATH=<Playwright installation> node performance/realtime-ui.cjs. This local-only synthetic test runs Chromium and mobile WebKit, checks all 13 data-backed screens, coalesces 20 events into one refetch per query, verifies cache reuse on return navigation, preserves drafts, reconciles on reconnect, and asserts no document reloads. These tests do not assert authenticated production behavior or real-device iOS performance.
