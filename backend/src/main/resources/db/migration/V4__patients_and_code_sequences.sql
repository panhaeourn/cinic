CREATE TABLE code_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_type VARCHAR(60) NOT NULL,
    sequence_year INTEGER NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_code_sequences_type_year UNIQUE (code_type, sequence_year)
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(180),
    address TEXT NOT NULL,
    blood_type VARCHAR(12),
    allergies TEXT,
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_patient_code ON patients(patient_code);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_user_id ON patients(user_id);
