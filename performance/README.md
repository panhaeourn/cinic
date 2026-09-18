# Performance budget

The k6 smoke budget exercises CSRF initialization, cookie-session login, authenticated session reads, and a cacheable public DTO.

```bash
k6 run -e BASE_URL=http://localhost:8080 -e TARGET_RPS=250 -e DURATION=30s performance/k6/clinic-smoke.js
```

`TARGET_RPS` describes the two-request steady-state workload, not iterations. Cookie sessions persist between iterations so authentication remains representative. The build fails above 1% errors, p95 250 ms, p99 500 ms, or any dropped iterations. Increase load only after recording CPU, memory, Hikari, and PostgreSQL metrics from `/actuator/prometheus` and `pg_stat_statements`.

For large-list and deep-cursor testing, load the isolated performance database with `psql -d clinic_perf_codex -f performance/sql/seed-patients.sql`. The seed is deterministic and safe to rerun because patient codes are unique and conflicts are ignored.

Then run `patient-cursor.js` with an authorized performance account. It mixes first-page, deep-cursor, and indexed-search requests:

```bash
k6 run -e BASE_URL=http://localhost:8080 -e PERF_EMAIL=user@example.com -e PERF_PASSWORD=test-only-password -e TARGET_RPS=250 performance/k6/patient-cursor.js
```

## UI responsiveness regression check

Build with npm --prefix frontend run build, then run npm --prefix frontend run preview -- --host 127.0.0.1 --port 4175.
In another terminal run node performance/ui-smoke.cjs from the repository root. The script needs Playwright resolvable by Node (or NODE_PATH pointing to an existing Playwright installation) and Microsoft Edge installed. UI_BASE_URL overrides the preview address.

The browser test uses synthetic API responses and never accesses real clinic records. It verifies:
- A rapid six-character queue search issues one queue request and no supporting-list reloads.
- A delayed old search response cannot replace newer results.
- Navigation remains visible during a delayed page-module download.
- The queue fits a 390px mobile viewport without horizontal overflow.
- No browser runtime errors occur in these flows.

The mobile screenshot is written to tmp/ui-performance/queue-mobile.png. These checks establish request behavior and UI correctness, not production INP, frame rate, or backend latency. Measure those with production data volumes and target devices before claiming a speed multiplier.

Search inputs in Queue, Appointments, Encounters, Vitals, Staff, and Access Control debounce network-triggering updates by 150ms. Queue uses separately cached form options and abortable result requests; its operational results refetch on entry. Page-code prefetch starts on navigation hover/focus/touch and skips reported data-saving or 2G connections. Existing iOS palette behavior is retained; the performance stylesheet removes selected large-area refraction and honors reduced motion.
