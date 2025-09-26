-- Create custom types
CREATE TYPE currency_code AS ENUM ('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY');

-- Create portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_currency currency_code NOT NULL DEFAULT 'EUR',
  baseline_date DATE NOT NULL,
  sharing_settings JSONB NOT NULL DEFAULT '{"is_shared": false, "shared_users": []}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT portfolios_name_length_check CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT portfolios_baseline_date_check CHECK (baseline_date <= CURRENT_DATE),
  CONSTRAINT portfolios_sharing_settings_check CHECK (jsonb_typeof(sharing_settings) = 'object'),
  CONSTRAINT portfolios_unique_name_per_user UNIQUE (user_id, name)
);

-- Create trigger for portfolios table
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_portfolios_user_id ON portfolios (user_id);
CREATE INDEX idx_portfolios_name ON portfolios (name);
CREATE INDEX idx_portfolios_baseline_date ON portfolios (baseline_date);
CREATE INDEX idx_portfolios_created_at ON portfolios (created_at);

-- Create GIN index for JSONB sharing_settings
CREATE INDEX idx_portfolios_sharing_settings ON portfolios USING GIN (sharing_settings);

-- Insert comments for documentation
COMMENT ON TABLE portfolios IS 'Top-level container for an investor''s complete real estate holdings';
COMMENT ON COLUMN portfolios.id IS 'Unique identifier for the portfolio';
COMMENT ON COLUMN portfolios.user_id IS 'Reference to the portfolio owner';
COMMENT ON COLUMN portfolios.name IS 'Portfolio display name, must be unique per user';
COMMENT ON COLUMN portfolios.base_currency IS 'Base currency for all calculations in this portfolio';
COMMENT ON COLUMN portfolios.baseline_date IS 'Reference date (T0) for portfolio analysis and calculations';
COMMENT ON COLUMN portfolios.sharing_settings IS 'Configuration for portfolio sharing and permissions';
COMMENT ON COLUMN portfolios.created_at IS 'Timestamp when the portfolio was created';
COMMENT ON COLUMN portfolios.updated_at IS 'Timestamp when the portfolio was last updated';

-- Sample sharing_settings JSON structure (for documentation)
-- sharing_settings JSON structure:
-- {
--   "is_shared": false,
--   "shared_users": [
--     {
--       "user_id": "uuid",
--       "permission": "read|comment|edit",
--       "granted_at": "2024-01-01T00:00:00Z",
--       "granted_by": "uuid"
--     }
--   ],
--   "share_settings": {
--     "allow_export": true,
--     "allow_copy": false,
--     "expire_at": null
--   }
-- }