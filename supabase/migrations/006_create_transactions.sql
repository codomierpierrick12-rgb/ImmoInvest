-- Create custom types
CREATE TYPE transaction_type AS ENUM (
  'rental_income',
  'operating_expense',
  'capex',
  'loan_payment',
  'tax_payment',
  'insurance_payment',
  'management_fee',
  'repair_maintenance',
  'utility_payment',
  'other_income',
  'other_expense'
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  payment_method TEXT,
  is_budgeted BOOLEAN NOT NULL DEFAULT FALSE,
  tax_deductible BOOLEAN NOT NULL DEFAULT TRUE,
  supporting_documents JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT transactions_category_length_check CHECK (char_length(category) BETWEEN 1 AND 100),
  CONSTRAINT transactions_description_length_check CHECK (char_length(description) BETWEEN 1 AND 500),
  CONSTRAINT transactions_amount_check CHECK (amount != 0),
  CONSTRAINT transactions_transaction_date_check CHECK (transaction_date <= CURRENT_DATE),
  CONSTRAINT transactions_supporting_docs_check CHECK (jsonb_typeof(supporting_documents) = 'array')
);

-- Create trigger for transactions table
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_transactions_property_id ON transactions (property_id);
CREATE INDEX idx_transactions_type ON transactions (transaction_type);
CREATE INDEX idx_transactions_category ON transactions (category);
CREATE INDEX idx_transactions_date ON transactions (transaction_date);
CREATE INDEX idx_transactions_amount ON transactions (amount);
CREATE INDEX idx_transactions_budgeted ON transactions (is_budgeted);
CREATE INDEX idx_transactions_tax_deductible ON transactions (tax_deductible);

-- Create GIN index for JSONB supporting_documents
CREATE INDEX idx_transactions_supporting_docs ON transactions USING GIN (supporting_documents);

-- Create composite indexes for common queries
CREATE INDEX idx_transactions_property_date ON transactions (property_id, transaction_date);
CREATE INDEX idx_transactions_property_type ON transactions (property_id, transaction_type);
CREATE INDEX idx_transactions_date_type ON transactions (transaction_date, transaction_type);
CREATE INDEX idx_transactions_property_date_type ON transactions (property_id, transaction_date, transaction_type);

-- Create partial indexes for specific use cases
CREATE INDEX idx_transactions_income ON transactions (property_id, transaction_date, amount)
  WHERE amount > 0;
CREATE INDEX idx_transactions_expenses ON transactions (property_id, transaction_date, amount)
  WHERE amount < 0;

-- Insert comments for documentation
COMMENT ON TABLE transactions IS 'Monthly operational events including rent receipts, expense payments, and capital improvements';
COMMENT ON COLUMN transactions.id IS 'Unique identifier for the transaction';
COMMENT ON COLUMN transactions.property_id IS 'Reference to the property this transaction relates to';
COMMENT ON COLUMN transactions.transaction_type IS 'Broad category of the transaction type';
COMMENT ON COLUMN transactions.category IS 'Specific subcategory within the transaction type';
COMMENT ON COLUMN transactions.description IS 'Detailed description of the transaction';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount (positive for income, negative for expenses)';
COMMENT ON COLUMN transactions.transaction_date IS 'Date when the transaction occurred';
COMMENT ON COLUMN transactions.payment_method IS 'Method of payment (cash, check, bank transfer, etc.)';
COMMENT ON COLUMN transactions.is_budgeted IS 'Whether this transaction was planned in the budget';
COMMENT ON COLUMN transactions.tax_deductible IS 'Whether this transaction is tax deductible';
COMMENT ON COLUMN transactions.supporting_documents IS 'Array of supporting document references';
COMMENT ON COLUMN transactions.created_at IS 'Timestamp when the transaction record was created';
COMMENT ON COLUMN transactions.updated_at IS 'Timestamp when the transaction record was last updated';

-- Sample supporting_documents JSON structure (for documentation)
-- supporting_documents JSON structure:
-- [
--   {
--     "type": "invoice|receipt|bank_statement|contract",
--     "filename": "invoice_2024_01.pdf",
--     "url": "https://storage.supabase.co/bucket/documents/...",
--     "uploaded_at": "2024-01-31T12:00:00Z",
--     "file_size": 256000,
--     "mime_type": "application/pdf"
--   },
--   {
--     "type": "photo",
--     "filename": "repair_before.jpg",
--     "url": "https://storage.supabase.co/bucket/photos/...",
--     "uploaded_at": "2024-01-31T12:05:00Z",
--     "file_size": 1024000,
--     "mime_type": "image/jpeg"
--   }
-- ]

-- Create function to get monthly cashflow for a property
CREATE OR REPLACE FUNCTION get_monthly_cashflow(
  property_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  month_year TEXT,
  rental_income DECIMAL(12,2),
  operating_expenses DECIMAL(12,2),
  capex DECIMAL(12,2),
  net_cashflow DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'YYYY-MM') as month_year,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'rental_income' THEN t.amount ELSE 0 END), 0) as rental_income,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'operating_expense' THEN ABS(t.amount) ELSE 0 END), 0) as operating_expenses,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'capex' THEN ABS(t.amount) ELSE 0 END), 0) as capex,
    COALESCE(SUM(t.amount), 0) as net_cashflow
  FROM transactions t
  WHERE t.property_id = property_uuid
    AND t.transaction_date >= start_date
    AND t.transaction_date <= end_date
  GROUP BY DATE_TRUNC('month', t.transaction_date)
  ORDER BY DATE_TRUNC('month', t.transaction_date);
END;
$$ LANGUAGE plpgsql;