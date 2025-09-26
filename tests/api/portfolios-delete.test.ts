import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('DELETE /api/v1/portfolios/{id} - Contract Test', () => {
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
      await supabase.from('portfolios').delete().eq('id', testPortfolioId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should delete portfolio successfully', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('deleted');

    // Verify portfolio is actually deleted
    const { data: portfolioData, error } = await supabase
      .from('portfolios')
      .select()
      .eq('id', testPortfolioId)
      .single();

    expect(error).toBeTruthy();
    expect(portfolioData).toBeNull();

    // Prevent cleanup from failing
    testPortfolioId = '';
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'DELETE',
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

    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${fakeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('not found');
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

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'DELETE',
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

  it('should handle cascading deletes correctly', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Create test property associated with portfolio
    const { data: propertyData } = await supabase
      .from('properties')
      .insert({
        portfolio_id: testPortfolioId,
        address: '123 Test Street',
        city: 'Test City',
        property_type: 'apartment',
        acquisition_price: 200000,
        current_value: 220000,
        acquisition_date: '2024-01-01',
      })
      .select()
      .single();

    const propertyId = propertyData?.id;

    // Delete portfolio
    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(200);

    // Verify associated property is also deleted (cascade)
    if (propertyId) {
      const { data: propertyCheck, error } = await supabase
        .from('properties')
        .select()
        .eq('id', propertyId)
        .single();

      expect(error).toBeTruthy();
      expect(propertyCheck).toBeNull();
    }

    // Prevent cleanup from failing
    testPortfolioId = '';
  });

  it('should return proper error for invalid UUID format', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const invalidId = 'invalid-uuid-format';

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${invalidId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid');
  });
});