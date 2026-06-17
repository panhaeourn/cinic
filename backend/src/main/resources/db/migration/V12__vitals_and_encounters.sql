CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    queue_ticket_id UUID REFERENCES queue_tickets(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    chief_complaint TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    queue_ticket_id UUID REFERENCES queue_tickets(id) ON DELETE SET NULL,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    nurse_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    temperature_c NUMERIC(5, 2),
    oxygen_saturation INTEGER,
    heart_rate INTEGER,
    weight_kg NUMERIC(6, 2),
    height_cm NUMERIC(6, 2),
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_doctor_id ON encounters(doctor_id);
CREATE INDEX idx_encounters_queue_ticket_id ON encounters(queue_ticket_id);
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_encounters_started_at ON encounters(started_at);
CREATE INDEX idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX idx_vitals_queue_ticket_id ON vitals(queue_ticket_id);
CREATE INDEX idx_vitals_encounter_id ON vitals(encounter_id);
CREATE INDEX idx_vitals_recorded_at ON vitals(recorded_at);
