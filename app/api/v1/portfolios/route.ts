import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, serverHelpers } from '@/lib/supabase/server';
import { portfolioCreateSchema, portfolioQuerySchema } from '@/lib/types/validation';
import { z } from 'zod';

// GET /api/v1/portfolios - List user portfolios
export async function GET(request: NextRequest) {
  try {
    // DEMO MODE: Return demo portfolios
    const demoPortfolios = [
      {
        id: 'portfolio-demo-1',
        name: 'Mon Portefeuille Immobilier',
        base_currency: 'EUR',
        baseline_date: '2024-01-01',
        user_id: 'demo-user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    return NextResponse.json({
      portfolios: demoPortfolios,
      total: demoPortfolios.length,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/portfolios - Create new portfolio
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const isAuthenticated = await serverHelpers.isServerAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const user = await serverHelpers.getServerUser();
    if (!user) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = portfolioCreateSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: validationError.errors[0]?.message || 'Validation failed',
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const supabase = createServerClient();

    // Create portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        base_currency: validatedData.base_currency,
        baseline_date: validatedData.baseline_date,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);

      // Handle unique constraint violation (duplicate portfolio name)
      if (error.code === '23505') {
        return NextResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'A portfolio with this name already exists',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create portfolio',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(portfolio, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}