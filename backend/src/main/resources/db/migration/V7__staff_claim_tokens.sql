CREATE TABLE staff_claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    claim_code VARCHAR(32) NOT NULL UNIQUE,
    target_email VARCHAR(180) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    used_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX idx_staff_claim_tokens_staff_id ON staff_claim_tokens(staff_id);
CREATE INDEX idx_staff_claim_tokens_target_email ON staff_claim_tokens(lower(target_email));
CREATE INDEX idx_staff_claim_tokens_used ON staff_claim_tokens(used);
