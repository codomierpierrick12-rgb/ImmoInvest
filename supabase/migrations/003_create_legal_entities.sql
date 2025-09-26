-- Create custom types
CREATE TYPE legal_entity_type AS ENUM ('personal', 'lmnp', 'sci_is');

-- Create legal_entities table
CREATE TABLE legal_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  type legal_entity_type NOT NULL,
  name TEXT NOT NULL,
  tax_settings JSONB NOT NULL DEFAULT '{}',
  incorporation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT legal_entities_name_length_check CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT legal_entities_tax_settings_check CHECK (jsonb_typeof(tax_settings) = 'object'),
  CONSTRAINT legal_entities_incorporation_date_check CHECK (
    (type = 'personal' AND incorporation_date IS NULL) OR
    (type IN ('lmnp', 'sci_is') AND incorporation_date IS NOT NULL AND incorporation_date <= CURRENT_DATE)
  ),
  CONSTRAINT legal_entities_unique_name_per_portfolio UNIQUE (portfolio_id, name)
);

-- Create trigger for legal_entities table
CREATE TRIGGER update_legal_entities_updated_at
  BEFORE UPDATE ON legal_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_legal_entities_portfolio_id ON legal_entities (portfolio_id);
CREATE INDEX idx_legal_entities_type ON legal_entities (type);
CREATE INDEX idx_legal_entities_name ON legal_entities (name);
CREATE INDEX idx_legal_entities_incorporation_date ON legal_entities (incorporation_date);

-- Create GIN index for JSONB tax_settings
CREATE INDEX idx_legal_entities_tax_settings ON legal_entities USING GIN (tax_settings);

-- Insert comments for documentation
COMMENT ON TABLE legal_entities IS 'Tax structures that own properties (Personal, LMNP, SCI IS)';
COMMENT ON COLUMN legal_entities.id IS 'Unique identifier for the legal entity';
COMMENT ON COLUMN legal_entities.portfolio_id IS 'Reference to the portfolio this entity belongs to';
COMMENT ON COLUMN legal_entities.type IS 'Type of legal entity determining tax calculation rules';
COMMENT ON COLUMN legal_entities.name IS 'Display name for the legal entity';
COMMENT ON COLUMN legal_entities.tax_settings IS 'Tax-specific configuration for this entity type';
COMMENT ON COLUMN legal_entities.incorporation_date IS 'Date of incorporation (required for LMNP and SCI IS, null for personal)';
COMMENT ON COLUMN legal_entities.created_at IS 'Timestamp when the legal entity was created';
COMMENT ON COLUMN legal_entities.updated_at IS 'Timestamp when the legal entity was last updated';

-- Sample tax_settings JSON structure by entity type (for documentation)
-- Personal entity tax_settings:
-- {
--   "jurisdiction": "France",
--   "tax_rates": {
--     "income_tax_rate": 30.0,
--     "social_charges_rate": 17.2
--   },
--   "capital_gains": {
--     "allowance_duration_years": true,
--     "exemption_duration_years": 30
--   }
-- }
--
-- LMNP entity tax_settings:
-- {
--   "jurisdiction": "France",
--   "tax_rates": {
--     "income_tax_rate": 30.0,
--     "social_charges_rate": 17.2
--   },
--   "depreciation": {
--     "building_rate": 2.5,
--     "furniture_rate": 10.0,
--     "equipment_rate": 20.0
--   },
--   "expense_limitations": {
--     "max_deduction_percentage": 100
--   }
-- }
--
-- SCI IS entity tax_settings:
-- {
--   "jurisdiction": "France",
--   "tax_rates": {
--     "corporate_tax_rate": 25.0,
--     "dividend_tax_rate": 12.8,
--     "social_charges_rate": 17.2
--   },
--   "depreciation": {
--     "building_rate": 2.5,
--     "equipment_rate": 20.0
--   },
--   "capital_gains": {
--     "depreciation_recapture": true,
--     "professional_rate": 25.0
--   }
-- }