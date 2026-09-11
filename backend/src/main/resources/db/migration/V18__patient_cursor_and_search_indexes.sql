CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS idx_patients_patient_code;

CREATE INDEX IF NOT EXISTS idx_patients_created_id_desc
    ON patients(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_patients_search_trgm
    ON patients USING gin (
        lower(
            patient_code || ' ' || first_name || ' ' || last_name || ' ' || phone || ' ' || coalesce(email, '')
        ) gin_trgm_ops
    );
