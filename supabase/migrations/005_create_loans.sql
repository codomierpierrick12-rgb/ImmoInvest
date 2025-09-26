-- Create custom types
CREATE TYPE loan_type AS ENUM ('amortizing', 'interest_only', 'bridge', 'balloon', 'variable_rate');
CREATE TYPE rate_type AS ENUM ('fixed', 'variable', 'mixed');
CREATE TYPE loan_status AS ENUM ('pending', 'active', 'paid_off', 'refinanced', 'defaulted');

-- Create loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  loan_type loan_type NOT NULL,
  initial_amount DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,4) NOT NULL,
  rate_type rate_type NOT NULL DEFAULT 'fixed',
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  monthly_payment DECIMAL(10,2),
  insurance_rate DECIMAL(5,4),
  early_repayment_penalty JSONB NOT NULL DEFAULT '{}',
  guarantees JSONB NOT NULL DEFAULT '{}',
  status loan_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT loans_name_length_check CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT loans_initial_amount_check CHECK (initial_amount > 0),
  CONSTRAINT loans_current_balance_check CHECK (current_balance >= 0 AND current_balance <= initial_amount),
  CONSTRAINT loans_interest_rate_check CHECK (interest_rate >= 0 AND interest_rate <= 30),
  CONSTRAINT loans_term_months_check CHECK (term_months > 0 AND term_months <= 600),
  CONSTRAINT loans_monthly_payment_check CHECK (monthly_payment IS NULL OR monthly_payment > 0),
  CONSTRAINT loans_insurance_rate_check CHECK (insurance_rate IS NULL OR (insurance_rate >= 0 AND insurance_rate <= 5)),
  CONSTRAINT loans_start_date_check CHECK (start_date <= CURRENT_DATE),
  CONSTRAINT loans_penalty_check CHECK (jsonb_typeof(early_repayment_penalty) = 'object'),
  CONSTRAINT loans_guarantees_check CHECK (jsonb_typeof(guarantees) = 'object')
);

-- Create trigger for loans table
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_loans_property_id ON loans (property_id);
CREATE INDEX idx_loans_loan_type ON loans (loan_type);
CREATE INDEX idx_loans_rate_type ON loans (rate_type);
CREATE INDEX idx_loans_status ON loans (status);
CREATE INDEX idx_loans_start_date ON loans (start_date);
CREATE INDEX idx_loans_current_balance ON loans (current_balance);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_loans_early_repayment_penalty ON loans USING GIN (early_repayment_penalty);
CREATE INDEX idx_loans_guarantees ON loans USING GIN (guarantees);

-- Create composite indexes for common queries
CREATE INDEX idx_loans_property_status ON loans (property_id, status);
CREATE INDEX idx_loans_type_status ON loans (loan_type, status);

-- Insert comments for documentation
COMMENT ON TABLE loans IS 'Financing instruments associated with properties';
COMMENT ON COLUMN loans.id IS 'Unique identifier for the loan';
COMMENT ON COLUMN loans.property_id IS 'Reference to the property this loan finances';
COMMENT ON COLUMN loans.name IS 'Display name/description for the loan';
COMMENT ON COLUMN loans.loan_type IS 'Type of loan structure and repayment schedule';
COMMENT ON COLUMN loans.initial_amount IS 'Original loan amount when first disbursed';
COMMENT ON COLUMN loans.current_balance IS 'Current outstanding balance on the loan';
COMMENT ON COLUMN loans.interest_rate IS 'Annual interest rate as percentage (e.g., 3.5 for 3.5%)';
COMMENT ON COLUMN loans.rate_type IS 'Whether the interest rate is fixed, variable, or mixed';
COMMENT ON COLUMN loans.term_months IS 'Total loan term in months';
COMMENT ON COLUMN loans.start_date IS 'Date when the loan was first disbursed';
COMMENT ON COLUMN loans.monthly_payment IS 'Regular monthly payment amount (principal + interest)';
COMMENT ON COLUMN loans.insurance_rate IS 'Loan insurance rate as percentage of loan amount';
COMMENT ON COLUMN loans.early_repayment_penalty IS 'Terms and conditions for early repayment penalties';
COMMENT ON COLUMN loans.guarantees IS 'Information about loan guarantees and collateral';
COMMENT ON COLUMN loans.status IS 'Current status of the loan';
COMMENT ON COLUMN loans.created_at IS 'Timestamp when the loan record was created';
COMMENT ON COLUMN loans.updated_at IS 'Timestamp when the loan record was last updated';

-- Sample early_repayment_penalty JSON structure (for documentation)
-- early_repayment_penalty JSON structure:
-- {
--   "has_penalty": true,
--   "penalty_type": "percentage|fixed_amount|sliding_scale",
--   "penalty_rate": 3.0,
--   "penalty_amount": 5000.00,
--   "penalty_duration_months": 60,
--   "conditions": {
--     "minimum_amount": 10000.00,
--     "excluded_periods": ["2024-01-01", "2024-12-31"],
--     "partial_repayment_allowed": true
--   }
-- }

-- Sample guarantees JSON structure (for documentation)
-- guarantees JSON structure:
-- {
--   "mortgage": {
--     "property_id": "uuid",
--     "rank": 1,
--     "amount": 400000.00
--   },
--   "personal_guarantee": {
--     "guarantor_name": "John Doe",
--     "amount": 100000.00,
--     "joint_liability": true
--   },
--   "insurance": {
--     "death_coverage": true,
--     "disability_coverage": true,
--     "unemployment_coverage": false,
--     "provider": "Insurance Company",
--     "policy_number": "POL123456"
--   }
-- }