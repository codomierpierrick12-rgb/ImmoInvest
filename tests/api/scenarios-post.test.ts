import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('POST /api/v1/portfolios/{id}/scenarios - Contract Test', () => {
  let testUserId: string;
  let testPortfolioId: string;

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
  });

  afterEach(async () => {
    // Clean up test data
    if (testPortfolioId) {
      await supabase.from('scenario_events').delete().eq('portfolio_id', testPortfolioId);
      await supabase.from('scenarios').delete().eq('portfolio_id', testPortfolioId);
      await supabase.from('portfolios').delete().eq('id', testPortfolioId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should create scenario with valid data', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const scenarioData = {
      name: 'Property Acquisition Scenario',
      description: 'Testing the impact of acquiring a new property',
      scenario_type: 'acquisition',
      start_date: '2024-04-01',
      end_date: '2029-03-31',
      status: 'draft',
      events: [
        {
          event_type: 'property_acquisition',
          event_date: '2024-04-01',
          event_data: {
            property_address: '123 New Property Street',
            property_city: 'Paris',
            acquisition_price: 350000,
            financing_amount: 280000,
            monthly_rent: 1800,
          },
        },
        {
          event_type: 'rent_increase',
          event_date: '2025-04-01',
          event_data: {
            property_id: null,
            rent_increase_percentage: 3.0,
          },
        },
      ],
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(scenarioData),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('scenario');
    expect(data.scenario).toMatchObject({
      name: scenarioData.name,
      description: scenarioData.description,
      scenario_type: scenarioData.scenario_type,
      start_date: scenarioData.start_date,
      end_date: scenarioData.end_date,
      status: scenarioData.status,
      portfolio_id: testPortfolioId,
    });
    expect(data.scenario).toHaveProperty('id');
    expect(data.scenario).toHaveProperty('created_at');

    // Verify events were created
    expect(data).toHaveProperty('events');
    expect(data.events).toHaveLength(2);
    data.events.forEach((event: any) => {
      expect(event).toHaveProperty('id');
      expect(event.scenario_id).toBe(data.scenario.id);
    });
  });

  it('should create scenario without events', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const scenarioData = {
      name: 'Simple Analysis Scenario',
      description: 'Basic scenario without specific events',
      scenario_type: 'analysis',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'active',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(scenarioData),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.scenario).toMatchObject(scenarioData);
    expect(data.events).toHaveLength(0);
  });

  it('should return 400 for invalid scenario data', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const invalidData = {
      name: '', // Empty name should be invalid
      scenario_type: 'invalid_type',
      start_date: 'invalid-date',
      end_date: '2024-01-01', // End date before start date
      status: 'invalid_status',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(invalidData),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('validation');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const scenarioData = {
      name: 'Test Scenario',
      scenario_type: 'analysis',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'draft',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scenarioData),
    });

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
    const scenarioData = {
      name: 'Test Scenario',
      scenario_type: 'analysis',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'draft',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${fakePortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(scenarioData),
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

    const scenarioData = {
      name: 'Test Scenario',
      scenario_type: 'analysis',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'draft',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(scenarioData),
    });

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('access');

    // Clean up
    await supabase.auth.admin.deleteUser(authData.user.id);
  });

  it('should validate event data structure', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const scenarioData = {
      name: 'Test Scenario with Invalid Events',
      scenario_type: 'acquisition',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'draft',
      events: [
        {
          event_type: 'property_acquisition',
          event_date: 'invalid-date',
          event_data: 'invalid-structure', // Should be object
        },
      ],
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(scenarioData),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('validation');
  });

  it('should handle disposal scenario correctly', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const scenarioData = {
      name: 'Property Disposal Scenario',
      description: 'Testing the impact of selling a property',
      scenario_type: 'disposal',
      start_date: '2024-06-01',
      end_date: '2024-06-30',
      status: 'draft',
      events: [
        {
          event_type: 'property_disposal',
          event_date: '2024-06-15',
          event_data: {
            property_id: null, // Would be actual property ID in real scenario
            sale_price: 280000,
            transaction_costs: 15000,
            capital_gains_tax: 8500,
          },
        },
      ],
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(scenarioData),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.scenario.scenario_type).toBe('disposal');
    expect(data.events).toHaveLength(1);
    expect(data.events[0].event_type).toBe('property_disposal');
  });
});