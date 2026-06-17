ALTER TABLE clinic_settings
    ADD COLUMN IF NOT EXISTS bakong_merchant_city VARCHAR(120) NOT NULL DEFAULT 'Phnom Penh',
    ADD COLUMN IF NOT EXISTS bakong_account_information VARCHAR(160) NOT NULL DEFAULT '';
