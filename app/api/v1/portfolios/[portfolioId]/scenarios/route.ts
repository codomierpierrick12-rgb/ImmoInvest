import { NextRequest, NextResponse } from 'next/server';
import { serverHelpers } from '@/lib/supabase/server';
import { scenarioCreateSchema } from '@/lib/types/validation';
import { z } from 'zod';

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid portfolio ID format');

// Query parameters schema
const querySchema = z.object({
  type: z.enum(['acquisition', 'disposal', 'refinancing', 'renovation', 'analysis']).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  include_events: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['created_at', 'start_date', 'end_date', 'name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
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
      status: searchParams.get('status'),
      include_events: searchParams.get('include_events'),
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

    // Build scenarios query
    let scenarioQuery = supabase
      .from('scenarios')
      .select('*', { count: 'exact' })
      .eq('portfolio_id', portfolioId);

    // Apply filters
    if (queryParams.type) {
      scenarioQuery = scenarioQuery.eq('scenario_type', queryParams.type);
    }

    if (queryParams.status) {
      scenarioQuery = scenarioQuery.eq('status', queryParams.status);
    }

    // Apply sorting
    scenarioQuery = scenarioQuery.order(queryParams.sort, { ascending: queryParams.order === 'asc' });

    // Apply pagination
    scenarioQuery = scenarioQuery.range(queryParams.offset, queryParams.offset + queryParams.limit - 1);

    const { data: scenarios, error: scenariosError, count } = await scenarioQuery;

    if (scenariosError) {
      console.error('Scenarios fetch error:', scenariosError);
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      );
    }

    // Fetch events if requested
    let scenariosWithEvents = scenarios || [];

    if (queryParams.include_events && scenarios && scenarios.length > 0) {
      const scenarioIds = scenarios.map(s => s.id);

      const { data: events, error: eventsError } = await supabase
        .from('scenario_events')
        .select('*')
        .in('scenario_id', scenarioIds)
        .order('event_date', { ascending: true });

      if (eventsError) {
        console.error('Events fetch error:', eventsError);
        return NextResponse.json(
          { error: 'Failed to fetch scenario events' },
          { status: 500 }
        );
      }

      // Group events by scenario ID
      const eventsByScenario = (events || []).reduce((acc, event) => {
        if (!acc[event.scenario_id]) {
          acc[event.scenario_id] = [];
        }
        acc[event.scenario_id].push(event);
        return acc;
      }, {} as Record<string, any[]>);

      // Add events to scenarios
      scenariosWithEvents = scenarios.map(scenario => ({
        ...scenario,
        events: eventsByScenario[scenario.id] || [],
      }));
    }

    return NextResponse.json({
      scenarios: scenariosWithEvents,
      pagination: {
        total: count || 0,
        limit: queryParams.limit,
        offset: queryParams.offset,
        has_more: (count || 0) > queryParams.offset + queryParams.limit,
      },
    });
  } catch (error) {
    console.error('Scenarios GET error:', error);

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
    const validatedData = scenarioCreateSchema.parse(body);

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

    // Start transaction
    const now = new Date().toISOString();

    // Create scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        portfolio_id: portfolioId,
        name: validatedData.name,
        description: validatedData.description,
        scenario_type: validatedData.scenario_type,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        status: validatedData.status || 'draft',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (scenarioError) {
      console.error('Scenario creation error:', scenarioError);
      return NextResponse.json(
        { error: 'Failed to create scenario' },
        { status: 500 }
      );
    }

    // Create scenario events if provided
    let createdEvents: any[] = [];

    if (validatedData.events && validatedData.events.length > 0) {
      const eventsToInsert = validatedData.events.map(event => ({
        scenario_id: scenario.id,
        portfolio_id: portfolioId,
        event_type: event.event_type,
        event_date: event.event_date,
        event_data: event.event_data,
        created_at: now,
        updated_at: now,
      }));

      const { data: events, error: eventsError } = await supabase
        .from('scenario_events')
        .insert(eventsToInsert)
        .select();

      if (eventsError) {
        console.error('Scenario events creation error:', eventsError);
        // Don't fail the entire request, just log the error
        console.warn('Scenario created but events failed to create');
      } else {
        createdEvents = events || [];
      }
    }

    return NextResponse.json(
      {
        scenario,
        events: createdEvents,
        message: 'Scenario created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Scenario creation error:', error);

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