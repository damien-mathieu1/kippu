CREATE TABLE IF NOT EXISTS dlq_errors (
    id SERIAL PRIMARY KEY,
    error_id VARCHAR(255) UNIQUE NOT NULL,
    source_topic VARCHAR(255) NOT NULL,
    partition INTEGER NOT NULL,
    "offset" VARCHAR(255) NOT NULL,
    raw_message JSONB NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'ignored')),
    retry_count INTEGER DEFAULT 0,
    error_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_dlq_errors_source_topic ON dlq_errors(source_topic);
CREATE INDEX IF NOT EXISTS idx_dlq_errors_status ON dlq_errors(status);
CREATE INDEX IF NOT EXISTS idx_dlq_errors_created_at ON dlq_errors(created_at);
CREATE INDEX IF NOT EXISTS idx_dlq_errors_error_timestamp ON dlq_errors(error_timestamp);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dlq_errors_updated_at ON dlq_errors;
CREATE TRIGGER update_dlq_errors_updated_at
    BEFORE UPDATE ON dlq_errors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
