import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/portfolios/route';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockSupabase,
  serverHelpers: {
    getServerUser: jest.fn(),
    isServerAuthenticated: jest.fn(),
  },
}));

describe('POST /api/v1/portfolios - Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should return 401 when user is not authenticated', async () => {
      const { serverHelpers } = await import('@/lib/supabase/server');
      (serverHelpers.isServerAuthenticated as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio',
          base_currency: 'EUR',
          baseline_date: '2024-01-01',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });
  });

  describe('Request Validation', () => {
    beforeEach(async () => {
      const { serverHelpers } = await import('@/lib/supabase/server');
      (serverHelpers.isServerAuthenticated as jest.Mock).mockResolvedValue(true);
      (serverHelpers.getServerUser as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      });
    });

    test('should return 400 when required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('name'),
      });
    });

    test('should return 400 when name is too long', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'a'.repeat(101), // Exceeds 100 character limit
          base_currency: 'EUR',
          baseline_date: '2024-01-01',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('name');
    });

    test('should return 400 when currency is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio',
          base_currency: 'INVALID',
          baseline_date: '2024-01-01',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('base_currency');
    });

    test('should return 400 when baseline_date is in future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio',
          base_currency: 'EUR',
          baseline_date: futureDate.toISOString().split('T')[0],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('baseline_date');
    });
  });

  describe('Success Cases', () => {
    beforeEach(async () => {
      const { serverHelpers } = await import('@/lib/supabase/server');
      (serverHelpers.isServerAuthenticated as jest.Mock).mockResolvedValue(true);
      (serverHelpers.getServerUser as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      });
    });

    test('should create portfolio with valid data', async () => {
      const mockPortfolio = {
        id: 'test-portfolio-id',
        user_id: 'test-user-id',
        name: 'Test Portfolio',
        base_currency: 'EUR',
        baseline_date: '2024-01-01',
        sharing_settings: { is_shared: false, shared_users: [] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockPortfolio,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio',
          base_currency: 'EUR',
          baseline_date: '2024-01-01',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockPortfolio);
      expect(mockSupabase.from).toHaveBeenCalledWith('portfolios');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        name: 'Test Portfolio',
        base_currency: 'EUR',
        baseline_date: '2024-01-01',
      });
    });

    test('should accept all valid currencies', async () => {
      const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF'];

      for (const currency of validCurrencies) {
        const mockPortfolio = {
          id: `test-portfolio-${currency}`,
          user_id: 'test-user-id',
          name: `Test Portfolio ${currency}`,
          base_currency: currency,
          baseline_date: '2024-01-01',
          sharing_settings: { is_shared: false, shared_users: [] },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: mockPortfolio,
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
          method: 'POST',
          body: JSON.stringify({
            name: `Test Portfolio ${currency}`,
            base_currency: currency,
            baseline_date: '2024-01-01',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
      }
    });
  });

  describe('Database Error Handling', () => {
    beforeEach(async () => {
      const { serverHelpers } = await import('@/lib/supabase/server');
      (serverHelpers.isServerAuthenticated as jest.Mock).mockResolvedValue(true);
      (serverHelpers.getServerUser as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      });
    });

    test('should return 500 when database error occurs', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio',
          base_currency: 'EUR',
          baseline_date: '2024-01-01',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    test('should return 400 when portfolio name already exists for user', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint',
          code: '23505',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Existing Portfolio',
          base_currency: 'EUR',
          baseline_date: '2024-01-01',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('already exists');
    });
  });

  describe('Response Format', () => {
    test('should return portfolio with correct schema', async () => {
      const { serverHelpers } = await import('@/lib/supabase/server');
      (serverHelpers.isServerAuthenticated as jest.Mock).mockResolvedValue(true);
      (serverHelpers.getServerUser as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      });

      const mockPortfolio = {
        id: 'test-portfolio-id',
        user_id: 'test-user-id',
        name: 'Test Portfolio',
        base_currency: 'EUR',
        baseline_date: '2024-01-01',
        sharing_settings: { is_shared: false, shared_users: [] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockPortfolio,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio',
          base_currency: 'EUR',
          baseline_date: '2024-01-01',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('base_currency');
      expect(data).toHaveProperty('baseline_date');
      expect(data).toHaveProperty('sharing_settings');
      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('updated_at');

      expect(typeof data.id).toBe('string');
      expect(typeof data.name).toBe('string');
      expect(['EUR', 'USD', 'GBP', 'CHF']).toContain(data.base_currency);
      expect(data.baseline_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof data.sharing_settings).toBe('object');
    });
  });
});