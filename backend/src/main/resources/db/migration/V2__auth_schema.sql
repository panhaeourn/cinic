CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(40),
    enabled BOOLEAN NOT NULL DEFAULT true,
    account_non_expired BOOLEAN NOT NULL DEFAULT true,
    account_non_locked BOOLEAN NOT NULL DEFAULT true,
    credentials_non_expired BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'System administrator'),
    ('DOCTOR', 'Clinic doctor'),
    ('PHARMACIST', 'Pharmacy staff'),
    ('CASHIER', 'Payment and invoice staff'),
    ('RECEPTIONIST', 'Registration and queue staff'),
    ('PATIENT', 'Patient portal user'),
    ('NURSE', 'Nursing staff');

INSERT INTO permissions (code, description) VALUES
    ('PATIENT_CREATE', 'Create patient records'),
    ('PATIENT_VIEW', 'View patient records'),
    ('APPOINTMENT_CREATE', 'Create appointments'),
    ('QUEUE_MANAGE', 'Manage clinic queue'),
    ('ENCOUNTER_CREATE', 'Create clinical encounters'),
    ('PRESCRIPTION_CREATE', 'Create prescriptions'),
    ('INVOICE_CREATE', 'Create invoices'),
    ('PAYMENT_CREATE', 'Create payments'),
    ('MEDICINE_MANAGE', 'Manage medicines and stock');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('PATIENT_VIEW', 'ENCOUNTER_CREATE', 'PRESCRIPTION_CREATE')
WHERE r.name = 'DOCTOR';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('PRESCRIPTION_CREATE', 'MEDICINE_MANAGE')
WHERE r.name = 'PHARMACIST';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('INVOICE_CREATE', 'PAYMENT_CREATE', 'PATIENT_VIEW')
WHERE r.name = 'CASHIER';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('PATIENT_CREATE', 'PATIENT_VIEW', 'APPOINTMENT_CREATE', 'QUEUE_MANAGE')
WHERE r.name = 'RECEPTIONIST';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('PATIENT_VIEW')
WHERE r.name = 'PATIENT';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('PATIENT_VIEW', 'QUEUE_MANAGE', 'ENCOUNTER_CREATE')
WHERE r.name = 'NURSE';
