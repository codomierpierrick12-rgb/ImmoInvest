-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  budget_year INTEGER NOT NULL,
  budget_month INTEGER,
  category TEXT NOT NULL,
  budgeted_amount DECIMAL(12,2) NOT NULL,
  actual_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  variance_threshold DECIMAL(5,2) NOT NULL DEFAULT 10.0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT budgets_year_check CHECK (budget_year >= 2020 AND budget_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 5),
  CONSTRAINT budgets_month_check CHECK (budget_month IS NULL OR (budget_month >= 1 AND budget_month <= 12)),
  CONSTRAINT budgets_category_length_check CHECK (char_length(category) BETWEEN 1 AND 100),
  CONSTRAINT budgets_variance_threshold_check CHECK (variance_threshold >= 0 AND variance_threshold <= 100),
  CONSTRAINT budgets_notes_length_check CHECK (notes IS NULL OR char_length(notes) <= 500),
  CONSTRAINT budgets_unique_property_period_category UNIQUE (property_id, budget_year, budget_month, category)
);

-- Create trigger for budgets table
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_budgets_property_id ON budgets (property_id);
CREATE INDEX idx_budgets_year ON budgets (budget_year);
CREATE INDEX idx_budgets_month ON budgets (budget_month);
CREATE INDEX idx_budgets_category ON budgets (category);
CREATE INDEX idx_budgets_variance ON budgets (ABS((actual_amount - budgeted_amount) / NULLIF(budgeted_amount, 0)) * 100);

-- Create composite indexes for common queries
CREATE INDEX idx_budgets_property_year ON budgets (property_id, budget_year);
CREATE INDEX idx_budgets_property_year_month ON budgets (property_id, budget_year, budget_month);

-- Insert comments for documentation
COMMENT ON TABLE budgets IS 'Planned income and expense targets with variance tracking and alert thresholds';
COMMENT ON COLUMN budgets.id IS 'Unique identifier for the budget entry';
COMMENT ON COLUMN budgets.property_id IS 'Reference to the property this budget relates to';
COMMENT ON COLUMN budgets.budget_year IS 'Year this budget applies to';
COMMENT ON COLUMN budgets.budget_month IS 'Specific month (1-12) or null for annual budget';
COMMENT ON COLUMN budgets.category IS 'Budget category matching transaction categories';
COMMENT ON COLUMN budgets.budgeted_amount IS 'Planned/target amount for this category and period';
COMMENT ON COLUMN budgets.actual_amount IS 'Actual amount spent/received (calculated from transactions)';
COMMENT ON COLUMN budgets.variance_threshold IS 'Percentage threshold for variance alerts';
COMMENT ON COLUMN budgets.notes IS 'Additional notes or assumptions for this budget item';
COMMENT ON COLUMN budgets.created_at IS 'Timestamp when the budget entry was created';
COMMENT ON COLUMN budgets.updated_at IS 'Timestamp when the budget entry was last updated';

-- Create function to update actual amounts from transactions
CREATE OR REPLACE FUNCTION update_budget_actuals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update budgets when transactions are inserted, updated, or deleted
  WITH transaction_totals AS (
    SELECT
      t.property_id,
      EXTRACT(YEAR FROM t.transaction_date) as year,
      EXTRACT(MONTH FROM t.transaction_date) as month,
      t.category,
      SUM(t.amount) as total_amount
    FROM transactions t
    WHERE t.property_id = COALESCE(NEW.property_id, OLD.property_id)
      AND EXTRACT(YEAR FROM t.transaction_date) = EXTRACT(YEAR FROM COALESCE(NEW.transaction_date, OLD.transaction_date))
      AND (
        EXTRACT(MONTH FROM t.transaction_date) = EXTRACT(MONTH FROM COALESCE(NEW.transaction_date, OLD.transaction_date))
        OR EXISTS (
          SELECT 1 FROM budgets b
          WHERE b.property_id = t.property_id
            AND b.budget_year = EXTRACT(YEAR FROM t.transaction_date)
            AND b.budget_month IS NULL
        )
      )
    GROUP BY t.property_id, EXTRACT(YEAR FROM t.transaction_date), EXTRACT(MONTH FROM t.transaction_date), t.category
  )
  UPDATE budgets b
  SET
    actual_amount = COALESCE(tt.total_amount, 0),
    updated_at = NOW()
  FROM transaction_totals tt
  WHERE b.property_id = tt.property_id
    AND b.budget_year = tt.year
    AND (
      (b.budget_month IS NULL) OR
      (b.budget_month = tt.month)
    )
    AND b.category = tt.category;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update budget actuals
CREATE TRIGGER update_budget_actuals_on_transaction_insert
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_actuals();

CREATE TRIGGER update_budget_actuals_on_transaction_update
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_actuals();

CREATE TRIGGER update_budget_actuals_on_transaction_delete
  AFTER DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_actuals();

-- Create function to get budget variance report
CREATE OR REPLACE FUNCTION get_budget_variance_report(
  property_uuid UUID,
  report_year INTEGER,
  report_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
  category TEXT,
  budgeted_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2),
  variance_amount DECIMAL(12,2),
  variance_percentage DECIMAL(5,2),
  is_over_threshold BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.category,
    b.budgeted_amount,
    b.actual_amount,
    (b.actual_amount - b.budgeted_amount) as variance_amount,
    CASE
      WHEN b.budgeted_amount = 0 THEN 0
      ELSE ROUND(((b.actual_amount - b.budgeted_amount) / ABS(b.budgeted_amount) * 100)::numeric, 2)
    END as variance_percentage,
    CASE
      WHEN b.budgeted_amount = 0 THEN FALSE
      ELSE ABS((b.actual_amount - b.budgeted_amount) / b.budgeted_amount * 100) > b.variance_threshold
    END as is_over_threshold
  FROM budgets b
  WHERE b.property_id = property_uuid
    AND b.budget_year = report_year
    AND (report_month IS NULL OR b.budget_month = report_month OR b.budget_month IS NULL)
  ORDER BY
    CASE WHEN b.budgeted_amount = 0 THEN 0 ELSE ABS((b.actual_amount - b.budgeted_amount) / b.budgeted_amount * 100) END DESC,
    b.category;
END;
$$ LANGUAGE plpgsql;

-- Create function to get properties with budget alerts
CREATE OR REPLACE FUNCTION get_budget_alerts(
  portfolio_uuid UUID DEFAULT NULL,
  alert_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
  property_id UUID,
  property_address TEXT,
  category TEXT,
  variance_percentage DECIMAL(5,2),
  variance_amount DECIMAL(12,2),
  threshold DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as property_id,
    p.address as property_address,
    b.category,
    CASE
      WHEN b.budgeted_amount = 0 THEN 0
      ELSE ROUND(((b.actual_amount - b.budgeted_amount) / ABS(b.budgeted_amount) * 100)::numeric, 2)
    END as variance_percentage,
    (b.actual_amount - b.budgeted_amount) as variance_amount,
    b.variance_threshold as threshold
  FROM budgets b
  JOIN properties p ON p.id = b.property_id
  JOIN legal_entities le ON le.id = p.legal_entity_id
  JOIN portfolios pf ON pf.id = le.portfolio_id
  WHERE b.budget_year = alert_year
    AND (portfolio_uuid IS NULL OR pf.id = portfolio_uuid)
    AND b.budgeted_amount != 0
    AND ABS((b.actual_amount - b.budgeted_amount) / b.budgeted_amount * 100) > b.variance_threshold
  ORDER BY
    ABS((b.actual_amount - b.budgeted_amount) / b.budgeted_amount * 100) DESC,
    p.address,
    b.category;
END;
$$ LANGUAGE plpgsql;