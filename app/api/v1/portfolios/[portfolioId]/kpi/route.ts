import { NextRequest, NextResponse } from 'next/server';
import { serverHelpers } from '@/lib/supabase/server';
import { calculatePropertyKPIs, calculatePortfolioKPIs, calculateMonthlyPerformance } from '@/lib/calculations/kpi';
import { z } from 'zod';

// Portfolio ID validation schema (UUID or demo ID)
const portfolioIdSchema = z.string().refine(
  (id) => z.string().uuid().safeParse(id).success || id.startsWith('portfolio-'),
  'Invalid portfolio ID format'
);

// Query parameters schema
const querySchema = z.object({
  include_properties: z.coerce.boolean().default(true),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  format: z.enum(['json', 'csv', 'summary']).default('json'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId: rawPortfolioId } = await params;
    // Validate portfolio ID format
    const portfolioId = portfolioIdSchema.parse(rawPortfolioId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = querySchema.parse({
      include_properties: searchParams.get('include_properties'),
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date'),
      format: searchParams.get('format'),
    });

    // For demo portfolios, return demo data
    if (portfolioId.startsWith('portfolio-')) {
      const demoKPIs = {
        portfolio_id: portfolioId,
        total_property_value: 1435000,
        total_loan_balance: 1235000,
        monthly_rental_income: 8500,
        monthly_expenses: 6650,
        net_monthly_cash_flow: 1850,
        total_equity: 200000,
        portfolio_yield: 0.071,
        occupancy_rate: 0.94,
        calculated_at: new Date().toISOString(),
      };

      return NextResponse.json({
        portfolio_kpi: demoKPIs,
        properties_kpi: [],
        monthly_performance: [],
        summary: {
          total_properties: 5,
          total_value: demoKPIs.total_property_value,
          total_equity: demoKPIs.total_equity,
          monthly_cash_flow: demoKPIs.net_monthly_cash_flow,
        }
      });
    }

    // Get authenticated user for real portfolios
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

    // Fetch portfolio properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (propertiesError) {
      console.error('Properties fetch error:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio properties' },
        { status: 500 }
      );
    }

    // Fetch active loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('status', 'active');

    if (loansError) {
      console.error('Loans fetch error:', loansError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio loans' },
        { status: 500 }
      );
    }

    // Fetch transactions (with date filtering if provided)
    let transactionQuery = supabase
      .from('transactions')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (queryParams.from_date) {
      transactionQuery = transactionQuery.gte('transaction_date', queryParams.from_date);
    }

    if (queryParams.to_date) {
      transactionQuery = transactionQuery.lte('transaction_date', queryParams.to_date);
    }

    const { data: transactions, error: transactionsError } = await transactionQuery
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      console.error('Transactions fetch error:', transactionsError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio transactions' },
        { status: 500 }
      );
    }

    // Calculate property-level KPIs
    const propertyKPIs = (properties || []).map(property => {
      const propertyLoans = (loans || []).filter(loan => loan.property_id === property.id);
      const propertyTransactions = (transactions || []).filter(t => t.property_id === property.id);

      return {
        ...calculatePropertyKPIs(property, propertyLoans, propertyTransactions),
        legal_entity_id: property.legal_entity_id,
        portfolio_id: portfolioId,
        calculated_at: new Date().toISOString(),
      };
    });

    // Calculate portfolio-level KPIs
    const portfolioKPI = {
      ...calculatePortfolioKPIs(
        propertyKPIs,
        portfolioId,
        user.id,
        portfolio.name,
        portfolio.base_currency,
        portfolio.baseline_date
      ),
      calculated_at: new Date().toISOString(),
    };

    // Handle different response formats
    switch (queryParams.format) {
      case 'csv':
        return handleCSVResponse(portfolioKPI, propertyKPIs);

      case 'summary':
        return NextResponse.json({
          summary: {
            total_value: portfolioKPI.total_property_value,
            total_debt: portfolioKPI.total_debt,
            net_worth: portfolioKPI.net_worth,
            ltv_ratio: portfolioKPI.portfolio_ltv,
            gross_yield: portfolioKPI.portfolio_gross_yield,
            net_yield: portfolioKPI.portfolio_net_yield,
            monthly_cashflow: portfolioKPI.total_monthly_cashflow,
            properties_count: portfolioKPI.active_properties,
          },
        });

      default:
        // JSON format
        const response: {
          portfolio_kpi: typeof portfolioKPI;
          property_kpis?: typeof propertyKPIs;
          monthly_performance?: unknown[];
        } = {
          portfolio_kpi: portfolioKPI,
        };

        if (queryParams.include_properties) {
          response.property_kpis = propertyKPIs;
        }

        // Add monthly performance trends if we have sufficient data
        if (transactions && transactions.length > 0) {
          response.monthly_performance = calculateMonthlyPerformance(transactions, 12);
        }

        return NextResponse.json(response);
    }
  } catch (error) {
    console.error('KPI calculation error:', error);

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

function handleCSVResponse(
  portfolioKPI: {
    portfolio_name: string;
    portfolio_id: string;
    total_property_value: number;
    total_acquisition_cost: number;
    total_debt: number;
    portfolio_ltv: number;
    total_annual_cashflow: number;
    portfolio_gross_yield: number;
    portfolio_net_yield: number;
    portfolio_capital_gain_percentage: number;
  },
  propertyKPIs: Array<{
    address: string;
    city: string;
    current_value: number;
    acquisition_price: number;
    total_debt: number;
    ltv_ratio: number;
    annual_cashflow: number;
    gross_rental_yield: number;
    net_rental_yield: number;
    capital_gain_percentage: number;
  }>
): NextResponse {
  // Generate CSV content
  const csvHeaders = [
    'Type',
    'Name/Address',
    'Current Value',
    'Acquisition Price',
    'Total Debt',
    'LTV Ratio',
    'Annual Cash Flow',
    'Gross Yield',
    'Net Yield',
    'Capital Gain %',
  ];

  const csvRows = [
    csvHeaders.join(','),
    // Portfolio summary row
    [
      'Portfolio',
      portfolioKPI.portfolio_name,
      portfolioKPI.total_property_value,
      portfolioKPI.total_acquisition_cost,
      portfolioKPI.total_debt,
      portfolioKPI.portfolio_ltv,
      portfolioKPI.total_annual_cashflow,
      portfolioKPI.portfolio_gross_yield,
      portfolioKPI.portfolio_net_yield,
      portfolioKPI.portfolio_capital_gain_percentage,
    ].join(','),
    // Property rows
    ...propertyKPIs.map(kpi => [
      'Property',
      `"${kpi.address}, ${kpi.city}"`,
      kpi.current_value,
      kpi.acquisition_price,
      kpi.total_debt,
      kpi.ltv_ratio,
      kpi.annual_cashflow,
      kpi.gross_rental_yield,
      kpi.net_rental_yield,
      kpi.capital_gain_percentage,
    ].join(',')),
  ];

  const csvContent = csvRows.join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="portfolio-kpi-${portfolioKPI.portfolio_id}.csv"`,
    },
  });
}