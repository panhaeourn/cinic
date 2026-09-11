\set ON_ERROR_STOP on
\set patient_count 1000000

INSERT INTO patients (
    id,
    patient_code,
    first_name,
    last_name,
    gender,
    date_of_birth,
    phone,
    email,
    address,
    blood_type,
    allergies,
    emergency_contact_name,
    emergency_contact_phone,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    'PT' || lpad(series_id::text, 12, '0'),
    'Patient' || series_id,
    'Loadtest' || (series_id % 10000),
    CASE series_id % 3 WHEN 0 THEN 'MALE' WHEN 1 THEN 'FEMALE' ELSE 'OTHER' END,
    DATE '1940-01-01' + (series_id % 30000),
    '+855' || lpad(series_id::text, 12, '0'),
    'patient' || series_id || '@loadtest.invalid',
    'Performance dataset address ' || (series_id % 50000),
    (ARRAY['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])[(series_id % 8) + 1],
    CASE WHEN series_id % 10 = 0 THEN 'Penicillin' ELSE NULL END,
    'Emergency Contact ' || series_id,
    '+856' || lpad(series_id::text, 12, '0'),
    TIMESTAMPTZ '2025-01-01 00:00:00+00' + series_id * INTERVAL '1 second',
    TIMESTAMPTZ '2025-01-01 00:00:00+00' + series_id * INTERVAL '1 second'
FROM generate_series(1, :patient_count) AS generated(series_id)
ON CONFLICT (patient_code) DO NOTHING;

ANALYZE patients;
