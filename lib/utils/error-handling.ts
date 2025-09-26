import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Error handling utilities for the application
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * Handle errors and return appropriate NextResponse
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      },
      { status: 400 }
    );
  }

  // Handle custom API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any;

    switch (supabaseError.code) {
      case 'PGRST116': // Row not found
        return NextResponse.json(
          {
            error: 'Resource not found',
            code: 'NOT_FOUND_ERROR',
          },
          { status: 404 }
        );

      case '23505': // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Resource already exists',
            code: 'CONFLICT_ERROR',
          },
          { status: 409 }
        );

      case '23503': // Foreign key constraint violation
        return NextResponse.json(
          {
            error: 'Invalid reference to related resource',
            code: 'REFERENCE_ERROR',
          },
          { status: 400 }
        );

      case '42501': // Insufficient permissions
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'AUTHORIZATION_ERROR',
          },
          { status: 403 }
        );

      default:
        console.error('Unhandled Supabase error:', supabaseError);
        break;
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development'
      ? error.message
      : 'Internal server error';

    return NextResponse.json(
      {
        error: message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Logger utility for structured logging
 */
export class Logger {
  private static formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };
    return JSON.stringify(logEntry);
  }

  static info(message: string, meta?: any): void {
    console.log(this.formatMessage('INFO', message, meta));
  }

  static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  static error(message: string, error?: any, meta?: any): void {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          ...(error.code && { code: error.code }),
        },
      }),
    };
    console.error(this.formatMessage('ERROR', message, errorMeta));
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, Date.now());
  }

  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      Logger.warn(`Performance timer '${label}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    Logger.info(`Performance: ${label}`, { duration: `${duration}ms` });
    return duration;
  }

  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

/**
 * Input sanitization utilities
 */
export class Sanitizer {
  /**
   * Sanitize string input to prevent injection attacks
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>'"&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[match] || match;
      })
      .trim();
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any): number | null {
    const num = Number(input);
    return isNaN(num) ? null : num;
  }

  /**
   * Sanitize date input
   */
  static sanitizeDate(input: any): Date | null {
    try {
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Sanitize boolean input
   */
  static sanitizeBoolean(input: any): boolean {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      return input.toLowerCase() === 'true';
    }
    return Boolean(input);
  }
}

/**
 * Request validation utilities
 */
export class RequestValidator {
  /**
   * Validate pagination parameters
   */
  static validatePagination(searchParams: URLSearchParams): {
    limit: number;
    offset: number;
  } {
    const limit = Math.min(
      Math.max(1, Sanitizer.sanitizeNumber(searchParams.get('limit')) || 50),
      100
    );
    const offset = Math.max(0, Sanitizer.sanitizeNumber(searchParams.get('offset')) || 0);

    return { limit, offset };
  }

  /**
   * Validate sorting parameters
   */
  static validateSorting(
    searchParams: URLSearchParams,
    allowedFields: string[]
  ): {
    sort: string;
    order: 'asc' | 'desc';
  } {
    const sort = searchParams.get('sort') || allowedFields[0];
    const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

    if (!allowedFields.includes(sort)) {
      throw new ValidationError(`Invalid sort field. Allowed: ${allowedFields.join(', ')}`);
    }

    return { sort, order };
  }

  /**
   * Validate date range parameters
   */
  static validateDateRange(searchParams: URLSearchParams): {
    fromDate?: string;
    toDate?: string;
  } {
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    if (fromDate && !Sanitizer.sanitizeDate(fromDate)) {
      throw new ValidationError('Invalid from_date format. Use YYYY-MM-DD.');
    }

    if (toDate && !Sanitizer.sanitizeDate(toDate)) {
      throw new ValidationError('Invalid to_date format. Use YYYY-MM-DD.');
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      throw new ValidationError('from_date must be before to_date.');
    }

    return {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    };
  }
}