# Clinic Management System

Clinic Management System monorepo.

## Structure

- `frontend/` - React + Vite clinic frontend
- `backend/` - Spring Boot clinic backend

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
./mvnw spring-boot:run
```

Set these environment variables before running real integrations:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET_BASE64`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BAKONG_TOKEN`
- `BAKONG_API_KEY`
- `BAKONG_MERCHANT_BAKONG_ACCOUNT_ID`
- `BAKONG_MERCHANT_ACCOUNT_INFORMATION`

## Notes

- Bakong KHQR, billing, reports, settings, access control, queue, vitals, encounters, patients, and staff workflows are included in this repository state.
- Generated folders such as `node_modules/`, `dist/`, and `target/` are intentionally excluded from version control.
- `backend/src/main/resources/application.yaml` now uses safe placeholders instead of committed live secrets. Override them through environment variables for local or production deployment.

## Secured production stack

Copy `.env.example` to `.env`, replace every placeholder, then run `docker compose up --build`. The app is served through Nginx at `http://localhost:8080`; PostgreSQL and the backend are isolated on Docker's internal network.

Browser authentication uses server-side, HttpOnly sessions with CSRF protection. Redis is intentionally not included for the single-backend deployment; add a shared session store only after scaling to multiple backend instances or when rate-limit coordination is measured as necessary.

Run `npm run verify` in `frontend/` and `./mvnw verify` in `backend/`. The CI workflow also checks dependency changes and enforces the k6 latency/error budget.
