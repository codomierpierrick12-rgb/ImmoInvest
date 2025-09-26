import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('GET /api/v1/portfolios/{id}/kpi - Contract Test', () => {
  let testUserId: string;
  let testPortfolioId: string;
  let testPropertyId: string;
  let testLoanId: string;

  beforeEach(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });

    if (authError) throw authError;
    testUserId = authData.user.id;

    // Create test portfolio
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: testUserId,
        name: 'Test Portfolio',
        base_currency: 'EUR',
        baseline_date: '2024-01-01',
      })
      .select()
      .single();

    if (portfolioError) throw portfolioError;
    testPortfolioId = portfolioData.id;

    // Create test property
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert({
        portfolio_id: testPortfolioId,
        address: '123 Test Street',
        city: 'Paris',
        property_type: 'apartment',
        acquisition_price: 250000,
        current_value: 275000,
        acquisition_date: '2024-01-15',
        property_subtype: 'T3',
        surface_area: 65.5,
      })
      .select()
      .single();

    if (propertyError) throw propertyError;
    testPropertyId = propertyData.id;

    // Create test loan
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .insert({
        property_id: testPropertyId,
        portfolio_id: testPortfolioId,
        loan_type: 'mortgage',
        lender_name: 'Test Bank',
        principal_amount: 200000,
        current_balance: 195000,
        interest_rate: 3.5,
        term_months: 240,
        monthly_payment: 1200,
        start_date: '2024-01-15',
        status: 'active',
      })
      .select()
      .single();

    if (loanError) throw loanError;
    testLoanId = loanData.id;

    // Create test transactions
    const transactions = [
      {
        portfolio_id: testPortfolioId,
        property_id: testPropertyId,
        transaction_type: 'rental_income',
        amount: 1800,
        transaction_date: '2024-02-01',
        description: 'Monthly rent February',
      },
      {
        portfolio_id: testPortfolioId,
        property_id: testPropertyId,
        transaction_type: 'rental_income',
        amount: 1800,
        transaction_date: '2024-03-01',
        description: 'Monthly rent March',
      },
      {
        portfolio_id: testPortfolioId,
        property_id: testPropertyId,
        transaction_type: 'operating_expense',
        amount: -200,
        transaction_date: '2024-02-15',
        description: 'Property management fee',
      },
      {
        portfolio_id: testPortfolioId,
        property_id: testPropertyId,
        transaction_type: 'loan_payment',
        amount: -1200,
        transaction_date: '2024-02-01',
        description: 'Monthly loan payment',
      },
      {
        portfolio_id: testPortfolioId,
        property_id: testPropertyId,
        transaction_type: 'loan_payment',
        amount: -1200,
        transaction_date: '2024-03-01',
        description: 'Monthly loan payment',
      },
    ];

    await supabase.from('transactions').insert(transactions);
  });

  afterEach(async () => {
    // Clean up test data
    if (testPortfolioId) {
      await supabase.from('transactions').delete().eq('portfolio_id', testPortfolioId);
      await supabase.from('loans').delete().eq('portfolio_id', testPortfolioId);
      await supabase.from('properties').delete().eq('portfolio_id', testPortfolioId);
      await supabase.from('portfolios').delete().eq('id', testPortfolioId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should return portfolio KPI with property-level details', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('portfolio_kpi');
    expect(data).toHaveProperty('property_kpis');

    // Verify portfolio KPI structure
    const portfolioKPI = data.portfolio_kpi;
    expect(portfolioKPI).toMatchObject({
      portfolio_id: testPortfolioId,
      user_id: testUserId,
      portfolio_name: 'Test Portfolio',
      base_currency: 'EUR',
      baseline_date: '2024-01-01',
      total_properties: 1,
      active_properties: 1,
      total_property_value: 275000,
      total_acquisition_cost: 250000,
      total_debt: 195000,
      net_worth: 80000, // 275000 - 195000
    });

    expect(portfolioKPI).toHaveProperty('portfolio_ltv');
    expect(portfolioKPI).toHaveProperty('total_annual_cashflow');
    expect(portfolioKPI).toHaveProperty('portfolio_gross_yield');
    expect(portfolioKPI).toHaveProperty('portfolio_net_yield');
    expect(portfolioKPI).toHaveProperty('calculated_at');

    // Verify property KPI structure
    expect(data.property_kpis).toHaveLength(1);
    const propertyKPI = data.property_kpis[0];
    expect(propertyKPI).toMatchObject({
      property_id: testPropertyId,
      address: '123 Test Street',
      city: 'Paris',
      current_value: 275000,
      acquisition_price: 250000,
      total_debt: 195000,
    });

    expect(propertyKPI).toHaveProperty('ltv_ratio');
    expect(propertyKPI).toHaveProperty('annual_cashflow');
    expect(propertyKPI).toHaveProperty('gross_rental_yield');
    expect(propertyKPI).toHaveProperty('net_rental_yield');
    expect(propertyKPI).toHaveProperty('capital_gain_percentage');
  });

  it('should return KPI summary only when include_properties=false', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi?include_properties=false`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('portfolio_kpi');
    expect(data).not.toHaveProperty('property_kpis');
  });

  it('should support date filtering for cash flow calculations', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Filter to only February transactions
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi?from_date=2024-02-01&to_date=2024-02-29`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.portfolio_kpi).toHaveProperty('total_annual_cashflow');

    // Should reflect only February transactions
    const propertyKPI = data.property_kpis[0];
    expect(propertyKPI.annual_rental_income).toBe(1800); // Only February rent
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi`);

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('authenticated');
  });

  it('should return 404 for non-existent portfolio', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const fakePortfolioId = '00000000-0000-0000-0000-000000000000';

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${fakePortfolioId}/kpi`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Portfolio not found');
  });

  it('should return 403 for unauthorized portfolio access', async () => {
    // Create another user
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-other-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });

    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authData.user.email!,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('access');

    // Clean up
    await supabase.auth.admin.deleteUser(authData.user.id);
  });

  it('should handle portfolio with no properties gracefully', async () => {
    // Create empty portfolio
    const { data: emptyPortfolio } = await supabase
      .from('portfolios')
      .insert({
        user_id: testUserId,
        name: 'Empty Portfolio',
        base_currency: 'EUR',
        baseline_date: '2024-01-01',
      })
      .select()
      .single();

    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${emptyPortfolio.id}/kpi`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.portfolio_kpi).toMatchObject({
      portfolio_id: emptyPortfolio.id,
      total_properties: 0,
      active_properties: 0,
      total_property_value: 0,
      total_acquisition_cost: 0,
      total_debt: 0,
      net_worth: 0,
    });
    expect(data.property_kpis).toHaveLength(0);

    // Clean up
    await supabase.from('portfolios').delete().eq('id', emptyPortfolio.id);
  });

  it('should calculate correct financial ratios', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify LTV calculation: 195000 / 275000 ≈ 70.91%
    expect(data.portfolio_kpi.portfolio_ltv).toBeCloseTo(70.91, 1);

    // Verify capital gain: (275000 - 250000) / 250000 = 10%
    expect(data.portfolio_kpi.portfolio_capital_gain_percentage).toBe(10);

    // Verify property-level calculations
    const propertyKPI = data.property_kpis[0];
    expect(propertyKPI.ltv_ratio).toBeCloseTo(70.91, 1);
    expect(propertyKPI.capital_gain_percentage).toBe(10);
    expect(propertyKPI.unrealized_capital_gain).toBe(25000);
  });

  it('should support different response formats', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Test CSV format request
    const csvResponse = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi?format=csv`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(csvResponse.status).toBe(200);
    expect(csvResponse.headers.get('content-type')).toContain('text/csv');

    // Test summary format
    const summaryResponse = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/kpi?format=summary`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(summaryResponse.status).toBe(200);

    const summaryData = await summaryResponse.json();
    expect(summaryData).toHaveProperty('summary');
    expect(summaryData.summary).toHaveProperty('total_value');
    expect(summaryData.summary).toHaveProperty('total_debt');
    expect(summaryData.summary).toHaveProperty('net_worth');
    expect(summaryData.summary).toHaveProperty('ltv_ratio');
  });
});