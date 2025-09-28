import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/portfolios/[portfolioId]/transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId } = await params;

    // DEMO MODE: Return demo transactions
    const demoTransactions = [
      {
        id: 'trans-demo-1',
        portfolio_id: portfolioId,
        property_id: 'prop-demo-1',
        property_name: '123 Rue de la République, Paris',
        type: 'income',
        category: 'Loyer',
        amount: 1800,
        description: 'Loyer mensuel septembre 2025',
        date: '2025-09-01',
        created_at: new Date().toISOString(),
      },
      {
        id: 'trans-demo-2',
        portfolio_id: portfolioId,
        property_id: 'prop-demo-1',
        property_name: '123 Rue de la République, Paris',
        type: 'expense',
        category: 'Entretien et réparations',
        amount: 450,
        description: 'Réparation chauffe-eau',
        date: '2025-09-15',
        created_at: new Date().toISOString(),
      },
      {
        id: 'trans-demo-3',
        portfolio_id: portfolioId,
        property_id: 'prop-demo-2',
        property_name: '45 Avenue Jean Jaurès, Lyon',
        type: 'income',
        category: 'Loyer',
        amount: 1200,
        description: 'Loyer mensuel septembre 2025',
        date: '2025-09-01',
        created_at: new Date().toISOString(),
      },
      {
        id: 'trans-demo-4',
        portfolio_id: portfolioId,
        property_id: 'prop-demo-2',
        property_name: '45 Avenue Jean Jaurès, Lyon',
        type: 'expense',
        category: 'Charges de copropriété',
        amount: 180,
        description: 'Charges trimestrielles Q3 2025',
        date: '2025-09-10',
        created_at: new Date().toISOString(),
      },
      {
        id: 'trans-demo-5',
        portfolio_id: portfolioId,
        property_id: 'prop-demo-3',
        property_name: '78 Rue Victor Hugo, Bordeaux',
        type: 'income',
        category: 'Loyer',
        amount: 1800,
        description: 'Loyer mensuel septembre 2025',
        date: '2025-09-01',
        created_at: new Date().toISOString(),
      },
      {
        id: 'trans-demo-6',
        portfolio_id: portfolioId,
        property_id: 'prop-demo-1',
        property_name: '123 Rue de la République, Paris',
        type: 'expense',
        category: 'Taxes foncières',
        amount: 1200,
        description: 'Taxe foncière 2025',
        date: '2025-09-20',
        created_at: new Date().toISOString(),
      },
    ];

    // Sort by date (most recent first)
    demoTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      transactions: demoTransactions,
      pagination: {
        total: demoTransactions.length,
        limit: 50,
        offset: 0,
        has_more: false,
      },
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/portfolios/[portfolioId]/transactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId } = await params;

    // Parse request body
    const body = await request.json();

    // DEMO MODE: Return created transaction
    const newTransaction = {
      id: `trans-demo-${Date.now()}`,
      portfolio_id: portfolioId,
      property_id: body.property_id,
      property_name: body.property_name || 'Bien non spécifié',
      type: body.type,
      category: body.category,
      amount: body.amount,
      description: body.description,
      date: body.date,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}