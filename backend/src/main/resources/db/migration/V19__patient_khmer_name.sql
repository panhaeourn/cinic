ALTER TABLE patients ADD COLUMN khmer_name varchar(160);

-- Keep the existing search index intact and index the optional Khmer name separately.
CREATE INDEX idx_patients_khmer_name_trgm
    ON patients USING gin (lower(khmer_name) gin_trgm_ops);
