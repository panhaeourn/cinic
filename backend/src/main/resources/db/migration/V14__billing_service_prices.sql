CREATE TABLE service_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    item_type VARCHAR(40) NOT NULL DEFAULT 'SERVICE',
    category VARCHAR(80) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_prices_active ON service_prices(active);
CREATE INDEX idx_service_prices_category ON service_prices(category);

INSERT INTO service_prices (code, name, item_type, category, price, active)
VALUES
    ('CONSULT', 'Consultation fee', 'CONSULTATION', 'Consultation', 8.05, true),
    ('FOLLOWUP', 'Follow-up consultation', 'CONSULTATION', 'Consultation', 5.00, true),
    ('LAB_BASIC', 'Basic lab test', 'SERVICE', 'Laboratory', 12.00, true),
    ('INJECTION', 'Injection service', 'SERVICE', 'Treatment', 3.00, true),
    ('WOUNDCARE', 'Wound care', 'SERVICE', 'Treatment', 7.50, true)
ON CONFLICT (code) DO NOTHING;
