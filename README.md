# cinic

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

## Notes

- Bakong KHQR, billing, reports, settings, access control, queue, vitals, encounters, patients, and staff workflows are included in this repository state.
- Generated folders such as `node_modules/`, `dist/`, and `target/` are intentionally excluded from version control.
