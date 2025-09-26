import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('GET /api/v1/portfolios/{id}/properties - Contract Test', () => {
  let testUserId: string;
  let testPortfolioId: string;
  let testPropertyIds: string[] = [];

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

    // Create test properties
    const properties = [
      {
        portfolio_id: testPortfolioId,
        address: '123 First Street',
        city: 'Paris',
        property_type: 'apartment',
        acquisition_price: 250000,
        current_value: 275000,
        acquisition_date: '2024-01-15',
        property_subtype: 'T3',
        surface_area: 65.5,
      },
      {
        portfolio_id: testPortfolioId,
        address: '456 Second Avenue',
        city: 'Lyon',
        property_type: 'house',
        acquisition_price: 180000,
        current_value: 195000,
        acquisition_date: '2024-02-01',
        surface_area: 120.0,
      },
      {
        portfolio_id: testPortfolioId,
        address: '789 Third Boulevard',
        city: 'Marseille',
        property_type: 'commercial',
        acquisition_price: 450000,
        current_value: 480000,
        acquisition_date: '2024-03-01',
        surface_area: 200.0,
      },
    ];

    const { data: createdProperties, error: propertyError } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (propertyError) throw propertyError;
    testPropertyIds = createdProperties.map(p => p.id);
  });

  afterEach(async () => {
    // Clean up test data
    if (testPropertyIds.length > 0) {
      await supabase.from('properties').delete().in('id', testPropertyIds);
    }
    if (testPortfolioId) {
      await supabase.from('portfolios').delete().eq('id', testPortfolioId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should return all properties for portfolio', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('properties');
    expect(Array.isArray(data.properties)).toBe(true);
    expect(data.properties).toHaveLength(3);

    // Verify property structure
    data.properties.forEach((property: any) => {
      expect(property).toHaveProperty('id');
      expect(property).toHaveProperty('address');
      expect(property).toHaveProperty('city');
      expect(property).toHaveProperty('property_type');
      expect(property).toHaveProperty('acquisition_price');
      expect(property).toHaveProperty('current_value');
      expect(property).toHaveProperty('acquisition_date');
      expect(property.portfolio_id).toBe(testPortfolioId);
    });

    // Verify ordering (should be by acquisition_date ASC by default)
    const addresses = data.properties.map((p: any) => p.address);
    expect(addresses).toEqual(['123 First Street', '456 Second Avenue', '789 Third Boulevard']);
  });

  it('should return empty array for portfolio with no properties', async () => {
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

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${emptyPortfolio.id}/properties`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('properties');
    expect(data.properties).toHaveLength(0);

    // Clean up
    await supabase.from('portfolios').delete().eq('id', emptyPortfolio.id);
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`);

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

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${fakePortfolioId}/properties`, {
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

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
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

  it('should support filtering by property type', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties?type=apartment`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.properties).toHaveLength(1);
    expect(data.properties[0].property_type).toBe('apartment');
    expect(data.properties[0].address).toBe('123 First Street');
  });

  it('should support filtering by city', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties?city=Lyon`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.properties).toHaveLength(1);
    expect(data.properties[0].city).toBe('Lyon');
    expect(data.properties[0].address).toBe('456 Second Avenue');
  });

  it('should support pagination', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties?limit=2&offset=1`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.properties).toHaveLength(2);
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toMatchObject({
      limit: 2,
      offset: 1,
      total: 3,
    });

    // Should return second and third properties
    const addresses = data.properties.map((p: any) => p.address);
    expect(addresses).toEqual(['456 Second Avenue', '789 Third Boulevard']);
  });

  it('should support sorting by different fields', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Sort by current_value DESC
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties?sort=current_value&order=desc`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.properties).toHaveLength(3);

    // Should be ordered by value: 480000, 275000, 195000
    const values = data.properties.map((p: any) => p.current_value);
    expect(values).toEqual([480000, 275000, 195000]);
  });
});