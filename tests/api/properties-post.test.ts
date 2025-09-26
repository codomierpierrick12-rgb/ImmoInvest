import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('POST /api/v1/portfolios/{id}/properties - Contract Test', () => {
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
      await supabase.from('properties').delete().eq('portfolio_id', testPortfolioId);
      await supabase.from('portfolios').delete().eq('id', testPortfolioId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should create property with valid data', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const propertyData = {
      address: '123 Test Street',
      city: 'Paris',
      postal_code: '75001',
      property_type: 'apartment',
      acquisition_price: 250000,
      current_value: 275000,
      acquisition_date: '2024-01-15',
      property_subtype: 'T3',
      surface_area: 65.5,
      number_of_rooms: 3,
      rental_type: 'furnished',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(propertyData),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('property');
    expect(data.property).toMatchObject({
      ...propertyData,
      portfolio_id: testPortfolioId,
    });
    expect(data.property).toHaveProperty('id');
    expect(data.property).toHaveProperty('created_at');
  });

  it('should return 400 for invalid property data', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const invalidData = {
      address: '', // Empty address should be invalid
      city: '',
      property_type: 'invalid_type',
      acquisition_price: -1000, // Negative price should be invalid
      current_value: 'not_a_number',
      acquisition_date: 'invalid-date',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
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
    const propertyData = {
      address: '123 Test Street',
      city: 'Paris',
      property_type: 'apartment',
      acquisition_price: 250000,
      current_value: 275000,
      acquisition_date: '2024-01-15',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
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
    const propertyData = {
      address: '123 Test Street',
      city: 'Paris',
      property_type: 'apartment',
      acquisition_price: 250000,
      current_value: 275000,
      acquisition_date: '2024-01-15',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${fakePortfolioId}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(propertyData),
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

    const propertyData = {
      address: '123 Test Street',
      city: 'Paris',
      property_type: 'apartment',
      acquisition_price: 250000,
      current_value: 275000,
      acquisition_date: '2024-01-15',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(propertyData),
    });

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('access');

    // Clean up
    await supabase.auth.admin.deleteUser(authData.user.id);
  });

  it('should handle minimal valid property data', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const minimalData = {
      address: '456 Minimal Street',
      city: 'Lyon',
      property_type: 'house',
      acquisition_price: 150000,
      current_value: 160000,
      acquisition_date: '2024-02-01',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(minimalData),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.property).toMatchObject(minimalData);
    expect(data.property.portfolio_id).toBe(testPortfolioId);
  });

  it('should validate date constraints correctly', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Test acquisition date in the future
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const invalidData = {
      address: '789 Future Street',
      city: 'Marseille',
      property_type: 'apartment',
      acquisition_price: 200000,
      current_value: 210000,
      acquisition_date: futureDate.toISOString().split('T')[0],
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}/properties`, {
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
    expect(data.error).toContain('date');
  });
});