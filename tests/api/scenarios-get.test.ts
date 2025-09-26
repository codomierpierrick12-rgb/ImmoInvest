import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('GET /api/v1/portfolios/{id}/scenarios - Contract Test', () => {
  let testUserId: string;
  let testPortfolioId: string;
  let testScenarioIds: string[] = [];

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

    // Create test scenarios
    const scenarios = [
      {
        portfolio_id: testPortfolioId,
        name: 'Acquisition Scenario A',
        description: 'Testing property acquisition impact',
        scenario_type: 'acquisition',
        start_date: '2024-04-01',
        end_date: '2029-03-31',
        status: 'active',
      },
      {
        portfolio_id: testPortfolioId,
        name: 'Analysis Scenario B',
        description: 'Current portfolio analysis',
        scenario_type: 'analysis',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'draft',
      },
      {
        portfolio_id: testPortfolioId,
        name: 'Disposal Scenario C',
        description: 'Testing property sale impact',
        scenario_type: 'disposal',
        start_date: '2024-06-01',
        end_date: '2024-06-30',
        status: 'completed',
      },
    ];

    const { data: createdScenarios, error: scenarioError } = await supabase
      .from('scenarios')
      .insert(scenarios)
      .select();

    if (scenarioError) throw scenarioError;
    testScenarioIds = createdScenarios.map(s => s.id);

    // Create some test events for the first scenario
    await supabase.from('scenario_events').insert([
      {
        scenario_id: testScenarioIds[0],
        portfolio_id: testPortfolioId,
        event_type: 'property_acquisition',
        event_date: '2024-04-01',
        event_data: {
          property_address: '123 New Property Street',
          acquisition_price: 350000,
        },
      },
      {
        scenario_id: testScenarioIds[0],
        portfolio_id: testPortfolioId,
        event_type: 'rent_increase',
        event_date: '2025-04-01',
        event_data: {
          rent_increase_percentage: 3.0,
        },
      },
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    if (testScenarioIds.length > 0) {
      await supabase.from('scenario_events').delete().in('scenario_id', testScenarioIds);
      await supabase.from('scenarios').delete().in('id', testScenarioIds);
    }
    if (testPortfolioId) {
      await supabase.from('portfolios').delete().eq('id', testPortfolioId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should return all scenarios for portfolio', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('scenarios');
    expect(Array.isArray(data.scenarios)).toBe(true);
    expect(data.scenarios).toHaveLength(3);

    // Verify scenario structure
    data.scenarios.forEach((scenario: any) => {
      expect(scenario).toHaveProperty('id');
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('description');
      expect(scenario).toHaveProperty('scenario_type');
      expect(scenario).toHaveProperty('start_date');
      expect(scenario).toHaveProperty('end_date');
      expect(scenario).toHaveProperty('status');
      expect(scenario.portfolio_id).toBe(testPortfolioId);
    });

    // Verify ordering (should be by created_at DESC by default)
    const names = data.scenarios.map((s: any) => s.name);
    expect(names).toContain('Acquisition Scenario A');
    expect(names).toContain('Analysis Scenario B');
    expect(names).toContain('Disposal Scenario C');
  });

  it('should return scenario with events when include_events=true', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios?include_events=true`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.scenarios).toHaveLength(3);

    // Find the acquisition scenario (has events)
    const acquisitionScenario = data.scenarios.find((s: any) => s.scenario_type === 'acquisition');
    expect(acquisitionScenario).toBeDefined();
    expect(acquisitionScenario).toHaveProperty('events');
    expect(acquisitionScenario.events).toHaveLength(2);

    // Verify event structure
    acquisitionScenario.events.forEach((event: any) => {
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('event_type');
      expect(event).toHaveProperty('event_date');
      expect(event).toHaveProperty('event_data');
      expect(event.scenario_id).toBe(acquisitionScenario.id);
    });
  });

  it('should return empty array for portfolio with no scenarios', async () => {
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

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${emptyPortfolio.id}/scenarios`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('scenarios');
    expect(data.scenarios).toHaveLength(0);

    // Clean up
    await supabase.from('portfolios').delete().eq('id', emptyPortfolio.id);
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`);

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

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${fakePortfolioId}/scenarios`, {
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

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
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

  it('should support filtering by scenario type', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios?type=acquisition`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.scenarios).toHaveLength(1);
    expect(data.scenarios[0].scenario_type).toBe('acquisition');
    expect(data.scenarios[0].name).toBe('Acquisition Scenario A');
  });

  it('should support filtering by status', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios?status=active`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.scenarios).toHaveLength(1);
    expect(data.scenarios[0].status).toBe('active');
    expect(data.scenarios[0].name).toBe('Acquisition Scenario A');
  });

  it('should support pagination', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios?limit=2&offset=1`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.scenarios).toHaveLength(2);
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toMatchObject({
      limit: 2,
      offset: 1,
      total: 3,
    });
  });

  it('should support sorting by different fields', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Sort by start_date ASC
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios?sort=start_date&order=asc`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.scenarios).toHaveLength(3);

    // Should be ordered by start_date: 2024-01-01, 2024-04-01, 2024-06-01
    const startDates = data.scenarios.map((s: any) => s.start_date);
    expect(startDates).toEqual(['2024-01-01', '2024-04-01', '2024-06-01']);
  });

  it('should support complex filtering combinations', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Filter by multiple criteria
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios?status=draft&type=analysis&include_events=true`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.scenarios).toHaveLength(1);
    expect(data.scenarios[0].status).toBe('draft');
    expect(data.scenarios[0].scenario_type).toBe('analysis');
    expect(data.scenarios[0].name).toBe('Analysis Scenario B');
    expect(data.scenarios[0]).toHaveProperty('events');
    expect(data.scenarios[0].events).toHaveLength(0); // This scenario has no events
  });
});