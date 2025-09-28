import { NextRequest, NextResponse } from 'next/server';
import { serverHelpers } from '@/lib/supabase/server';
import { portfolioUpdateSchema } from '@/lib/types/validation';
import { z } from 'zod';

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid portfolio ID format');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId: rawPortfolioId } = await params;
    // Validate portfolio ID format
    const portfolioId = uuidSchema.parse(rawPortfolioId);

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
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Get portfolio properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('acquisition_date', { ascending: true });

    if (propertiesError) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio properties' },
        { status: 500 }
      );
    }

    // Get portfolio loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (loansError) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio loans' },
        { status: 500 }
      );
    }

    // Get recent transactions (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .gte('transaction_date', twelveMonthsAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio transactions' },
        { status: 500 }
      );
    }

    // Get scenarios
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (scenariosError) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio scenarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      portfolio,
      properties: properties || [],
      loans: loans || [],
      transactions: transactions || [],
      scenarios: scenarios || [],
      summary: {
        total_properties: properties?.length || 0,
        total_property_value: properties?.reduce((sum, p) => sum + p.current_value, 0) || 0,
        total_debt: loans?.reduce((sum, l) => sum + l.current_balance, 0) || 0,
        monthly_rental_income: transactions
          ?.filter(t => t.transaction_type === 'rental_income')
          ?.reduce((sum, t) => sum + t.amount, 0) || 0,
      },
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid portfolio ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId: rawPortfolioId } = await params;
    // Validate portfolio ID format
    const portfolioId = uuidSchema.parse(rawPortfolioId);

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
    const validatedData = portfolioUpdateSchema.parse(body);

    // Get Supabase client
    const supabase = await serverHelpers.getServerClient();

    // Check if user has access to this portfolio
    const { data: existingPortfolio, error: checkError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Update portfolio
    const { data: portfolio, error: updateError } = await supabase
      .from('portfolios')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolioId)
      .select()
      .single();

    if (updateError) {
      console.error('Portfolio update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      portfolio,
      message: 'Portfolio updated successfully',
    });
  } catch (error) {
    console.error('Portfolio update error:', error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId: rawPortfolioId } = await params;
    // Validate portfolio ID format
    const portfolioId = uuidSchema.parse(rawPortfolioId);

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
    const { data: existingPortfolio, error: checkError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Delete portfolio (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);

    if (deleteError) {
      console.error('Portfolio delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    console.error('Portfolio delete error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid portfolio ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}