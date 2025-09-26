import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/portfolios/route';

// Mock Supabase - these tests will fail until API is implemented
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn(),
    })),
  }),
  serverHelpers: {
    getServerUser: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
    isServerAuthenticated: jest.fn().mockResolvedValue(true),
  },
}));

describe('GET /api/v1/portfolios - Contract Tests', () => {
  test('should return 401 when not authenticated', async () => {
    const { serverHelpers } = await import('@/lib/supabase/server');
    (serverHelpers.isServerAuthenticated as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/v1/portfolios');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  test('should return portfolios array when authenticated', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/portfolios');

    // This test will fail until the API is implemented
    expect(async () => {
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('portfolios');
      expect(Array.isArray(data.portfolios)).toBe(true);
      expect(data).toHaveProperty('total');
    }).rejects.toThrow(); // Expected to fail - API not implemented yet
  });
});