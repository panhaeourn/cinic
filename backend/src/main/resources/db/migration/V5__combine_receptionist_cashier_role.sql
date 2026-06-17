INSERT INTO roles (name, description)
VALUES ('RECEPTIONIST_CASHIER', 'Patient registration, queue, invoice, and payment staff')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'PATIENT_CREATE',
    'PATIENT_VIEW',
    'APPOINTMENT_CREATE',
    'QUEUE_MANAGE',
    'INVOICE_CREATE',
    'PAYMENT_CREATE'
)
WHERE r.name = 'RECEPTIONIST_CASHIER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT DISTINCT ur.user_id, combined_role.id
FROM user_roles ur
JOIN roles old_role ON old_role.id = ur.role_id
JOIN roles combined_role ON combined_role.name = 'RECEPTIONIST_CASHIER'
WHERE old_role.name IN ('RECEPTIONIST', 'CASHIER')
ON CONFLICT DO NOTHING;

DELETE FROM user_roles
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('RECEPTIONIST', 'CASHIER'));

DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('RECEPTIONIST', 'CASHIER'));

DELETE FROM roles
WHERE name IN ('RECEPTIONIST', 'CASHIER');
