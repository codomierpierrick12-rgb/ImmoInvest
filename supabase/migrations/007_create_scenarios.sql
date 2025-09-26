-- Create custom types for scenarios
CREATE TYPE scenario_type AS ENUM ('acquisition', 'disposal', 'refinancing', 'mixed');
CREATE TYPE scenario_status AS ENUM ('draft', 'active', 'executed', 'archived');

-- Create custom types for scenario events
CREATE TYPE scenario_event_type AS ENUM ('property_acquisition', 'property_disposal', 'loan_refinancing', 'loan_addition', 'value_adjustment');

-- Create scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scenario_type scenario_type NOT NULL,
  base_date DATE NOT NULL,
  projection_years INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  assumptions JSONB NOT NULL DEFAULT '{}',
  status scenario_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT scenarios_name_length_check CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT scenarios_description_length_check CHECK (description IS NULL OR char_length(description) <= 1000),
  CONSTRAINT scenarios_projection_years_check CHECK (projection_years BETWEEN 1 AND 30),
  CONSTRAINT scenarios_base_date_check CHECK (base_date <= CURRENT_DATE + INTERVAL '1 year'),
  CONSTRAINT scenarios_assumptions_check CHECK (jsonb_typeof(assumptions) = 'object'),
  CONSTRAINT scenarios_unique_name_per_portfolio UNIQUE (portfolio_id, name)
);

-- Create scenario_events table
CREATE TABLE scenario_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  event_type scenario_event_type NOT NULL,
  event_date DATE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  financial_impact JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT scenario_events_event_data_check CHECK (jsonb_typeof(event_data) = 'object'),
  CONSTRAINT scenario_events_financial_impact_check CHECK (jsonb_typeof(financial_impact) = 'object')
);

-- Create triggers for scenarios and scenario_events tables
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenario_events_updated_at
  BEFORE UPDATE ON scenario_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for scenarios table
CREATE INDEX idx_scenarios_portfolio_id ON scenarios (portfolio_id);
CREATE INDEX idx_scenarios_type ON scenarios (scenario_type);
CREATE INDEX idx_scenarios_status ON scenarios (status);
CREATE INDEX idx_scenarios_base_date ON scenarios (base_date);
CREATE INDEX idx_scenarios_name ON scenarios (name);

-- Create GIN index for JSONB assumptions
CREATE INDEX idx_scenarios_assumptions ON scenarios USING GIN (assumptions);

-- Create indexes for scenario_events table
CREATE INDEX idx_scenario_events_scenario_id ON scenario_events (scenario_id);
CREATE INDEX idx_scenario_events_type ON scenario_events (event_type);
CREATE INDEX idx_scenario_events_date ON scenario_events (event_date);
CREATE INDEX idx_scenario_events_property_id ON scenario_events (property_id);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_scenario_events_data ON scenario_events USING GIN (event_data);
CREATE INDEX idx_scenario_events_impact ON scenario_events USING GIN (financial_impact);

-- Create composite indexes for common queries
CREATE INDEX idx_scenarios_portfolio_status ON scenarios (portfolio_id, status);
CREATE INDEX idx_scenario_events_scenario_date ON scenario_events (scenario_id, event_date);

-- Insert comments for documentation
COMMENT ON TABLE scenarios IS 'Simulation environments for testing acquisition, disposal, or refinancing decisions';
COMMENT ON COLUMN scenarios.id IS 'Unique identifier for the scenario';
COMMENT ON COLUMN scenarios.portfolio_id IS 'Reference to the portfolio this scenario belongs to';
COMMENT ON COLUMN scenarios.name IS 'Display name for the scenario';
COMMENT ON COLUMN scenarios.scenario_type IS 'Type of scenario being modeled';
COMMENT ON COLUMN scenarios.base_date IS 'Starting date for scenario projections';
COMMENT ON COLUMN scenarios.projection_years IS 'Number of years to project into the future';
COMMENT ON COLUMN scenarios.description IS 'Detailed description of the scenario';
COMMENT ON COLUMN scenarios.assumptions IS 'Market assumptions and parameters for the scenario';
COMMENT ON COLUMN scenarios.status IS 'Current status of the scenario';
COMMENT ON COLUMN scenarios.created_at IS 'Timestamp when the scenario was created';
COMMENT ON COLUMN scenarios.updated_at IS 'Timestamp when the scenario was last updated';

COMMENT ON TABLE scenario_events IS 'Individual events within a scenario (buy, sell, refinance)';
COMMENT ON COLUMN scenario_events.id IS 'Unique identifier for the scenario event';
COMMENT ON COLUMN scenario_events.scenario_id IS 'Reference to the scenario this event belongs to';
COMMENT ON COLUMN scenario_events.event_type IS 'Type of event being modeled';
COMMENT ON COLUMN scenario_events.event_date IS 'Date when this event would occur';
COMMENT ON COLUMN scenario_events.property_id IS 'Reference to existing property (null for new acquisitions)';
COMMENT ON COLUMN scenario_events.event_data IS 'Event-specific parameters and details';
COMMENT ON COLUMN scenario_events.financial_impact IS 'Calculated financial impact of this event';
COMMENT ON COLUMN scenario_events.created_at IS 'Timestamp when the event was created';
COMMENT ON COLUMN scenario_events.updated_at IS 'Timestamp when the event was last updated';

-- Sample assumptions JSON structure (for documentation)
-- assumptions JSON structure:
-- {
--   "market_conditions": {
--     "property_appreciation_rate": 2.5,
--     "rental_growth_rate": 2.0,
--     "inflation_rate": 2.0,
--     "interest_rate_trend": "stable|rising|falling"
--   },
--   "financing": {
--     "default_ltv": 80.0,
--     "default_interest_rate": 3.5,
--     "default_term_years": 20
--   },
--   "costs": {
--     "transaction_cost_percentage": 7.5,
--     "annual_management_rate": 6.0,
--     "maintenance_rate": 1.0
--   },
--   "taxation": {
--     "capital_gains_rate": 19.0,
--     "income_tax_rate": 30.0,
--     "depreciation_rate": 2.5
--   }
-- }

-- Sample event_data JSON structure by event type (for documentation)
-- Property Acquisition event_data:
-- {
--   "property": {
--     "address": "123 Rue Example, Paris",
--     "city": "Paris",
--     "price": 500000.00,
--     "property_type": "apartment",
--     "surface_area": 75.0,
--     "expected_rental_yield": 4.5
--   },
--   "financing": {
--     "loan_amount": 400000.00,
--     "interest_rate": 3.5,
--     "term_years": 20,
--     "loan_type": "amortizing"
--   },
--   "costs": {
--     "acquisition_costs": 35000.00,
--     "renovation_costs": 10000.00
--   }
-- }

-- Property Disposal event_data:
-- {
--   "sale_price": 580000.00,
--   "transaction_costs": 25000.00,
--   "early_repayment_penalty": 5000.00,
--   "capital_gains_tax": 15000.00,
--   "net_proceeds": 535000.00
-- }

-- Loan Refinancing event_data:
-- {
--   "current_loan": {
--     "balance": 350000.00,
--     "rate": 4.0,
--     "remaining_term_months": 180
--   },
--   "new_loan": {
--     "amount": 350000.00,
--     "rate": 2.8,
--     "term_months": 240,
--     "fees": 3000.00
--   },
--   "savings": {
--     "monthly_payment_reduction": 200.00,
--     "total_interest_savings": 25000.00
--   }
-- }