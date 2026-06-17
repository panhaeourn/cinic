INSERT INTO permissions (code, description) VALUES
    ('PATIENT_UPDATE', 'Update patient records'),
    ('PATIENT_HISTORY_VIEW', 'View patient medical history'),
    ('APPOINTMENT_VIEW', 'View appointments'),
    ('APPOINTMENT_UPDATE', 'Update appointments'),
    ('APPOINTMENT_CANCEL', 'Cancel appointments'),
    ('QUEUE_VIEW', 'View clinic queue'),
    ('ENCOUNTER_VIEW', 'View encounters'),
    ('ENCOUNTER_UPDATE', 'Update encounters'),
    ('ENCOUNTER_COMPLETE', 'Complete encounters'),
    ('VITALS_CREATE', 'Create vitals'),
    ('VITALS_VIEW', 'View vitals'),
    ('VITALS_UPDATE', 'Update vitals'),
    ('DIAGNOSIS_CREATE', 'Create diagnoses'),
    ('PRESCRIPTION_VIEW', 'View prescriptions'),
    ('PRESCRIPTION_DISPENSE', 'Dispense prescriptions'),
    ('MEDICINE_VIEW', 'View medicines'),
    ('MEDICINE_CREATE', 'Create medicines'),
    ('MEDICINE_UPDATE', 'Update medicines'),
    ('BATCH_MANAGE', 'Manage medicine batches'),
    ('INVENTORY_VIEW', 'View inventory'),
    ('INVENTORY_ADJUST', 'Adjust inventory'),
    ('LOW_STOCK_VIEW', 'View low stock medicines'),
    ('EXPIRING_MEDICINE_VIEW', 'View expiring medicines'),
    ('INVOICE_VIEW', 'View invoices'),
    ('PAYMENT_VIEW', 'View payments'),
    ('RECEIPT_PRINT', 'Print receipts'),
    ('BASIC_REPORT_VIEW', 'View basic front-desk reports'),
    ('PATIENT_READY_UPDATE', 'Mark patient ready for doctor'),
    ('SELF_PROFILE_VIEW', 'View own profile'),
    ('SELF_PROFILE_UPDATE', 'Update own profile'),
    ('SELF_APPOINTMENT_VIEW', 'View own appointments'),
    ('SELF_VISIT_HISTORY_VIEW', 'View own visit history'),
    ('SELF_PRESCRIPTION_VIEW', 'View own prescriptions'),
    ('SELF_INVOICE_VIEW', 'View own invoices'),
    ('SELF_PAYMENT_VIEW', 'View own payments'),
    ('SELF_RECEIPT_DOWNLOAD', 'Download own receipts')
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'PATIENT_CREATE',
    'PATIENT_VIEW',
    'PATIENT_UPDATE',
    'APPOINTMENT_CREATE',
    'APPOINTMENT_VIEW',
    'APPOINTMENT_UPDATE',
    'APPOINTMENT_CANCEL',
    'QUEUE_MANAGE',
    'QUEUE_VIEW',
    'INVOICE_CREATE',
    'INVOICE_VIEW',
    'PAYMENT_CREATE',
    'PAYMENT_VIEW',
    'RECEIPT_PRINT',
    'BASIC_REPORT_VIEW'
)
WHERE r.name = 'RECEPTIONIST_CASHIER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'PATIENT_VIEW',
    'PATIENT_HISTORY_VIEW',
    'APPOINTMENT_VIEW',
    'QUEUE_VIEW',
    'ENCOUNTER_CREATE',
    'ENCOUNTER_VIEW',
    'ENCOUNTER_UPDATE',
    'ENCOUNTER_COMPLETE',
    'VITALS_VIEW',
    'DIAGNOSIS_CREATE',
    'PRESCRIPTION_CREATE',
    'PRESCRIPTION_VIEW'
)
WHERE r.name = 'DOCTOR'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'PATIENT_VIEW',
    'QUEUE_VIEW',
    'VITALS_CREATE',
    'VITALS_VIEW',
    'VITALS_UPDATE',
    'ENCOUNTER_VIEW',
    'PATIENT_READY_UPDATE'
)
WHERE r.name = 'NURSE'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'PRESCRIPTION_VIEW',
    'PRESCRIPTION_DISPENSE',
    'MEDICINE_VIEW',
    'MEDICINE_CREATE',
    'MEDICINE_UPDATE',
    'MEDICINE_MANAGE',
    'BATCH_MANAGE',
    'INVENTORY_VIEW',
    'INVENTORY_ADJUST',
    'LOW_STOCK_VIEW',
    'EXPIRING_MEDICINE_VIEW'
)
WHERE r.name = 'PHARMACIST'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'SELF_PROFILE_VIEW',
    'SELF_PROFILE_UPDATE',
    'SELF_APPOINTMENT_VIEW',
    'SELF_VISIT_HISTORY_VIEW',
    'SELF_PRESCRIPTION_VIEW',
    'SELF_INVOICE_VIEW',
    'SELF_PAYMENT_VIEW',
    'SELF_RECEIPT_DOWNLOAD'
)
WHERE r.name = 'PATIENT'
ON CONFLICT DO NOTHING;

DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'PATIENT')
  AND permission_id IN (SELECT id FROM permissions WHERE code = 'PATIENT_VIEW');
