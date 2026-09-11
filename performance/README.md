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
