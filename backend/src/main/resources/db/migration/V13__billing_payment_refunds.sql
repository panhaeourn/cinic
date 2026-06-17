ALTER TABLE payments
    ADD COLUMN refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN refund_reason TEXT,
    ADD COLUMN refunded_at TIMESTAMPTZ;

CREATE INDEX idx_payments_refunded_at ON payments(refunded_at);
