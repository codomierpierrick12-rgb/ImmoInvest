import { NextRequest, NextResponse } from 'next/server';
import { serverHelpers } from '@/lib/supabase/server';
import { propertyCreateSchema } from '@/lib/types/validation';
import { z } from 'zod';

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid portfolio ID format');

// Query parameters schema
const querySchema = z.object({
  type: z.string().optional(),
  city: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['acquisition_date', 'current_value', 'address', 'city']).default('acquisition_date'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    // Validate portfolio ID format
    const portfolioId = uuidSchema.parse(params.portfolioId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = querySchema.parse({
      type: searchParams.get('type'),
      city: searchParams.get('city'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    });

    // Get authenticated user
    const user = await serverHelpers.getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Supabase client
    const supabase = await serverHelpers.getServerClient();

    // Check if user has access to this portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('portfolio_id', portfolioId);

    // Apply filters
    if (queryParams.type) {
      query = query.eq('property_type', queryParams.type);
    }

    if (queryParams.city) {
      query = query.ilike('city', `%${queryParams.city}%`);
    }

    // Apply sorting
    query = query.order(queryParams.sort, { ascending: queryParams.order === 'asc' });

    // Apply pagination
    query = query.range(queryParams.offset, queryParams.offset + queryParams.limit - 1);

    const { data: properties, error: propertiesError, count } = await query;

    if (propertiesError) {
      console.error('Properties fetch error:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      properties: properties || [],
      pagination: {
        total: count || 0,
        limit: queryParams.limit,
        offset: queryParams.offset,
        has_more: (count || 0) > queryParams.offset + queryParams.limit,
      },
    });
  } catch (error) {
    console.error('Properties GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    // Validate portfolio ID format
    const portfolioId = uuidSchema.parse(params.portfolioId);

    // Get authenticated user
    const user = await serverHelpers.getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = propertyCreateSchema.parse(body);

    // Get Supabase client
    const supabase = await serverHelpers.getServerClient();

    // Check if user has access to this portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Create property
    const { data: property, error: createError } = await supabase
      .from('properties')
      .insert({
        ...validatedData,
        portfolio_id: portfolioId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Property creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create property' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        property,
        message: 'Property created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Property creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}