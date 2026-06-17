ALTER TABLE payments
    ADD COLUMN received_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_payments_received_by_user_id ON payments(received_by_user_id);
CREATE INDEX idx_payments_paid_at_received_by ON payments(paid_at, received_by_user_id);
