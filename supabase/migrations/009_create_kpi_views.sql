-- Create materialized view for property-level KPIs
CREATE MATERIALIZED VIEW property_kpis AS
SELECT
  p.id as property_id,
  p.legal_entity_id,
  le.portfolio_id,
  p.address,
  p.city,
  p.current_value,
  p.acquisition_price,
  p.acquisition_date,

  -- Loan metrics
  COALESCE(SUM(l.current_balance), 0) as total_debt,
  COALESCE(SUM(l.monthly_payment), 0) as total_monthly_payment,
  COALESCE(AVG(l.interest_rate), 0) as weighted_avg_interest_rate,

  -- LTV calculation
  CASE
    WHEN p.current_value > 0 THEN ROUND((COALESCE(SUM(l.current_balance), 0) / p.current_value * 100)::numeric, 2)
    ELSE 0
  END as ltv_ratio,

  -- Monthly cash flow (last 12 months)
  COALESCE((
    SELECT SUM(t.amount)
    FROM transactions t
    WHERE t.property_id = p.id
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  ), 0) as annual_cashflow,

  COALESCE((
    SELECT SUM(t.amount) / 12
    FROM transactions t
    WHERE t.property_id = p.id
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  ), 0) as avg_monthly_cashflow,

  -- Rental income (last 12 months)
  COALESCE((
    SELECT SUM(t.amount)
    FROM transactions t
    WHERE t.property_id = p.id
      AND t.transaction_type = 'rental_income'
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  ), 0) as annual_rental_income,

  -- Operating expenses (last 12 months)
  COALESCE((
    SELECT ABS(SUM(t.amount))
    FROM transactions t
    WHERE t.property_id = p.id
      AND t.transaction_type = 'operating_expense'
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  ), 0) as annual_operating_expenses,

  -- CAPEX (last 12 months)
  COALESCE((
    SELECT ABS(SUM(t.amount))
    FROM transactions t
    WHERE t.property_id = p.id
      AND t.transaction_type = 'capex'
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  ), 0) as annual_capex,

  -- Gross rental yield
  CASE
    WHEN p.current_value > 0 THEN ROUND((
      COALESCE((
        SELECT SUM(t.amount)
        FROM transactions t
        WHERE t.property_id = p.id
          AND t.transaction_type = 'rental_income'
          AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
      ), 0) / p.current_value * 100
    )::numeric, 2)
    ELSE 0
  END as gross_rental_yield,

  -- Net rental yield
  CASE
    WHEN p.current_value > 0 THEN ROUND((
      COALESCE((
        SELECT SUM(t.amount)
        FROM transactions t
        WHERE t.property_id = p.id
          AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
      ), 0) / p.current_value * 100
    )::numeric, 2)
    ELSE 0
  END as net_rental_yield,

  -- Capital gain (unrealized)
  (p.current_value - p.acquisition_price) as unrealized_capital_gain,

  CASE
    WHEN p.acquisition_price > 0 THEN ROUND(((p.current_value - p.acquisition_price) / p.acquisition_price * 100)::numeric, 2)
    ELSE 0
  END as capital_gain_percentage,

  -- DSCR (Debt Service Coverage Ratio)
  CASE
    WHEN COALESCE(SUM(l.monthly_payment), 0) > 0 THEN ROUND((
      COALESCE((
        SELECT SUM(t.amount) / 12
        FROM transactions t
        WHERE t.property_id = p.id
          AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
      ), 0) / COALESCE(SUM(l.monthly_payment), 1)
    )::numeric, 2)
    ELSE NULL
  END as dscr_ratio,

  CURRENT_DATE as calculated_at

FROM properties p
LEFT JOIN legal_entities le ON le.id = p.legal_entity_id
LEFT JOIN loans l ON l.property_id = p.id AND l.status = 'active'
WHERE p.status = 'active'
GROUP BY p.id, p.legal_entity_id, le.portfolio_id, p.address, p.city,
         p.current_value, p.acquisition_price, p.acquisition_date;

-- Create materialized view for portfolio-level KPIs
CREATE MATERIALIZED VIEW portfolio_kpis AS
SELECT
  pf.id as portfolio_id,
  pf.user_id,
  pf.name as portfolio_name,
  pf.base_currency,
  pf.baseline_date,

  -- Property counts
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_properties,

  -- Value metrics
  COALESCE(SUM(p.current_value), 0) as total_property_value,
  COALESCE(SUM(p.acquisition_price), 0) as total_acquisition_cost,
  COALESCE(SUM(pk.total_debt), 0) as total_debt,
  COALESCE(SUM(p.current_value) - SUM(pk.total_debt), 0) as net_worth,

  -- Portfolio LTV
  CASE
    WHEN SUM(p.current_value) > 0 THEN ROUND((SUM(pk.total_debt) / SUM(p.current_value) * 100)::numeric, 2)
    ELSE 0
  END as portfolio_ltv,

  -- Cash flow metrics
  COALESCE(SUM(pk.annual_cashflow), 0) as total_annual_cashflow,
  COALESCE(SUM(pk.avg_monthly_cashflow), 0) as total_monthly_cashflow,
  COALESCE(SUM(pk.annual_rental_income), 0) as total_rental_income,
  COALESCE(SUM(pk.annual_operating_expenses), 0) as total_operating_expenses,
  COALESCE(SUM(pk.annual_capex), 0) as total_capex,

  -- Portfolio yields
  CASE
    WHEN SUM(p.current_value) > 0 THEN ROUND((SUM(pk.annual_rental_income) / SUM(p.current_value) * 100)::numeric, 2)
    ELSE 0
  END as portfolio_gross_yield,

  CASE
    WHEN SUM(p.current_value) > 0 THEN ROUND((SUM(pk.annual_cashflow) / SUM(p.current_value) * 100)::numeric, 2)
    ELSE 0
  END as portfolio_net_yield,

  -- Portfolio DSCR
  CASE
    WHEN SUM(pk.total_monthly_payment) > 0 THEN ROUND((SUM(pk.avg_monthly_cashflow) / SUM(pk.total_monthly_payment))::numeric, 2)
    ELSE NULL
  END as portfolio_dscr,

  -- Capital gains
  COALESCE(SUM(p.current_value) - SUM(p.acquisition_price), 0) as total_unrealized_gains,

  CASE
    WHEN SUM(p.acquisition_price) > 0 THEN ROUND(((SUM(p.current_value) - SUM(p.acquisition_price)) / SUM(p.acquisition_price) * 100)::numeric, 2)
    ELSE 0
  END as portfolio_capital_gain_percentage,

  CURRENT_DATE as calculated_at

FROM portfolios pf
LEFT JOIN legal_entities le ON le.portfolio_id = pf.id
LEFT JOIN properties p ON p.legal_entity_id = le.id AND p.status = 'active'
LEFT JOIN property_kpis pk ON pk.property_id = p.id
GROUP BY pf.id, pf.user_id, pf.name, pf.base_currency, pf.baseline_date;

-- Create materialized view for monthly portfolio performance
CREATE MATERIALIZED VIEW monthly_portfolio_performance AS
SELECT
  pf.id as portfolio_id,
  DATE_TRUNC('month', t.transaction_date) as month_year,

  -- Monthly cash flows
  COALESCE(SUM(CASE WHEN t.transaction_type = 'rental_income' THEN t.amount ELSE 0 END), 0) as monthly_rental_income,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'operating_expense' THEN t.amount ELSE 0 END), 0) as monthly_operating_expenses,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'capex' THEN t.amount ELSE 0 END), 0) as monthly_capex,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'loan_payment' THEN t.amount ELSE 0 END), 0) as monthly_loan_payments,
  COALESCE(SUM(t.amount), 0) as monthly_net_cashflow,

  -- Cumulative metrics
  SUM(SUM(t.amount)) OVER (
    PARTITION BY pf.id
    ORDER BY DATE_TRUNC('month', t.transaction_date)
    ROWS UNBOUNDED PRECEDING
  ) as cumulative_cashflow,

  CURRENT_DATE as calculated_at

FROM portfolios pf
JOIN legal_entities le ON le.portfolio_id = pf.id
JOIN properties p ON p.legal_entity_id = le.id
JOIN transactions t ON t.property_id = p.id
WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY pf.id, DATE_TRUNC('month', t.transaction_date)
ORDER BY pf.id, DATE_TRUNC('month', t.transaction_date);

-- Create indexes on materialized views
CREATE UNIQUE INDEX idx_property_kpis_property_id ON property_kpis (property_id);
CREATE INDEX idx_property_kpis_portfolio_id ON property_kpis (portfolio_id);
CREATE INDEX idx_property_kpis_ltv ON property_kpis (ltv_ratio);
CREATE INDEX idx_property_kpis_yield ON property_kpis (net_rental_yield);

CREATE UNIQUE INDEX idx_portfolio_kpis_portfolio_id ON portfolio_kpis (portfolio_id);
CREATE INDEX idx_portfolio_kpis_user_id ON portfolio_kpis (user_id);
CREATE INDEX idx_portfolio_kpis_ltv ON portfolio_kpis (portfolio_ltv);
CREATE INDEX idx_portfolio_kpis_yield ON portfolio_kpis (portfolio_net_yield);

CREATE INDEX idx_monthly_performance_portfolio_month ON monthly_portfolio_performance (portfolio_id, month_year);

-- Create function to refresh KPI materialized views
CREATE OR REPLACE FUNCTION refresh_kpi_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY property_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_portfolio_performance;
END;
$$ LANGUAGE plpgsql;

-- Create function to refresh KPIs for a specific portfolio
CREATE OR REPLACE FUNCTION refresh_portfolio_kpis(portfolio_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- For now, refresh all views since we can't selectively refresh materialized views
  -- In production, consider using regular views or implementing incremental updates
  PERFORM refresh_kpi_views();
END;
$$ LANGUAGE plpgsql;

-- Insert comments for documentation
COMMENT ON MATERIALIZED VIEW property_kpis IS 'Calculated KPIs for individual properties including LTV, yields, cash flow, and DSCR';
COMMENT ON MATERIALIZED VIEW portfolio_kpis IS 'Aggregated KPIs at portfolio level including total values, yields, and performance metrics';
COMMENT ON MATERIALIZED VIEW monthly_portfolio_performance IS 'Monthly cash flow performance tracking for portfolios over time';

-- Note: In production, set up a scheduled job to refresh these views periodically
-- Example cron job (run daily at 2 AM):
-- SELECT cron.schedule('refresh-kpis', '0 2 * * *', 'SELECT refresh_kpi_views();');