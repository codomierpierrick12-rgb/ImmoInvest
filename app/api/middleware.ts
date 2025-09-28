import { NextRequest, NextResponse } from 'next/server';
import { serverHelpers } from '@/lib/supabase/server';

/**
 * Authentication middleware for API routes
 * Checks if user is authenticated and adds user context to request
 */
export async function authenticateRequest(_request: NextRequest): Promise<{
  user: { id: string; email?: string } | null;
  error?: string;
  status?: number;
}> {
  try {
    const user = await serverHelpers.getServerUser();

    if (!user) {
      return {
        user: null,
        error: 'Authentication required. Please log in to access this resource.',
        status: 401,
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return {
      user: null,
      error: 'Authentication service unavailable',
      status: 503,
    };
  }
}

/**
 * Portfolio access middleware
 * Checks if user has access to the specified portfolio
 */
export async function checkPortfolioAccess(
  portfolioId: string,
  userId: string
): Promise<{
  hasAccess: boolean;
  portfolio?: { id: string; name: string; user_id: string };
  error?: string;
  status?: number;
}> {
  try {
    const supabase = await serverHelpers.getServerClient();

    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single();

    if (error || !portfolio) {
      return {
        hasAccess: false,
        error: 'Portfolio not found or access denied',
        status: 404,
      };
    }

    return {
      hasAccess: true,
      portfolio,
    };
  } catch (error) {
    console.error('Portfolio access check error:', error);
    return {
      hasAccess: false,
      error: 'Unable to verify portfolio access',
      status: 500,
    };
  }
}

/**
 * Property access middleware
 * Checks if user has access to the specified property through portfolio ownership
 */
export async function checkPropertyAccess(
  propertyId: string,
  userId: string
): Promise<{
  hasAccess: boolean;
  property?: { id: string; address: string; portfolios?: { id: string; user_id: string; name: string } };
  portfolio?: { id: string; user_id: string; name: string };
  error?: string;
  status?: number;
}> {
  try {
    const supabase = await serverHelpers.getServerClient();

    // Get property with portfolio information
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        *,
        portfolios!inner (
          id,
          user_id,
          name
        )
      `)
      .eq('id', propertyId)
      .eq('portfolios.user_id', userId)
      .single();

    if (propertyError || !property) {
      return {
        hasAccess: false,
        error: 'Property not found or access denied',
        status: 404,
      };
    }

    return {
      hasAccess: true,
      property,
      portfolio: property.portfolios,
    };
  } catch (error) {
    console.error('Property access check error:', error);
    return {
      hasAccess: false,
      error: 'Unable to verify property access',
      status: 500,
    };
  }
}

/**
 * Rate limiting middleware (simplified implementation)
 * In production, use a proper rate limiting service like Redis
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime < windowStart) {
      requestCounts.delete(key);
    }
  }

  const current = requestCounts.get(identifier);

  if (!current) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (current.resetTime < now) {
    // Reset the window
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  current.count++;
  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * CORS middleware for API routes
 */
export function setCORSHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Input validation middleware
 */
export function validateUUID(value: string, paramName: string = 'ID'): {
  isValid: boolean;
  error?: string;
} {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return {
      isValid: false,
      error: `Invalid ${paramName} format. Expected a valid UUID.`,
    };
  }

  return { isValid: true };
}

/**
 * Error response helper
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  const body: { error: string; details?: unknown } = { error: message };

  if (details) {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}

/**
 * Success response helper
 */
export function createSuccessResponse(
  data: unknown,
  message?: string,
  status: number = 200
): NextResponse {
  const body: { message?: string } = typeof data === 'object' && data !== null ? { ...data as object } : { data };

  if (message) {
    body.message = message;
  }

  return NextResponse.json(body, { status });
}