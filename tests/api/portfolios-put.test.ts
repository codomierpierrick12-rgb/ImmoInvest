import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('PUT /api/v1/portfolios/{id} - Contract Test', () => {
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

  it('should update portfolio with valid data', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const updateData = {
      name: 'Updated Portfolio Name',
      base_currency: 'USD',
      baseline_date: '2024-02-01',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('portfolio');
    expect(data.portfolio).toMatchObject({
      id: testPortfolioId,
      name: updateData.name,
      base_currency: updateData.base_currency,
      baseline_date: updateData.baseline_date,
      user_id: testUserId,
    });
    expect(data.portfolio).toHaveProperty('updated_at');
  });

  it('should return 400 for invalid portfolio data', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    const invalidData = {
      name: '', // Empty name should be invalid
      base_currency: 'INVALID',
      baseline_date: 'invalid-date',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'PUT',
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
    const updateData = {
      name: 'Updated Portfolio Name',
      base_currency: 'USD',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
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
    const updateData = {
      name: 'Updated Portfolio Name',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${fakeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(updateData),
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

    const updateData = {
      name: 'Updated Portfolio Name',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('access');

    // Clean up
    await supabase.auth.admin.deleteUser(authData.user.id);
  });

  it('should handle partial updates correctly', async () => {
    const { data: { session } } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${Date.now()}@example.com`,
    });

    // Only update the name
    const partialUpdate = {
      name: 'Partially Updated Portfolio',
    };

    const response = await fetch(`http://localhost:3000/api/v1/portfolios/${testPortfolioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(partialUpdate),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.portfolio.name).toBe(partialUpdate.name);
    // Other fields should remain unchanged
    expect(data.portfolio.base_currency).toBe('EUR'); // Original value
    expect(data.portfolio.baseline_date).toBe('2024-01-01'); // Original value
  });
});