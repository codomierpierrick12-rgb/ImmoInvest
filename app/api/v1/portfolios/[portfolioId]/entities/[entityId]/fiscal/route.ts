import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/portfolios/[portfolioId]/entities/[entityId]/fiscal
export async function POST(
  request: NextRequest,
  { params }: { params: { portfolioId: string; entityId: string } }
) {
  try {
    const body = await request.json();
    const { year = new Date().getFullYear() } = body;
    const resolvedParams = await params;

    // DEMO MODE: Return demo fiscal data
    const demoFiscalData = {
      entity_summary: {
        entity_id: resolvedParams.entityId,
        entity_name: resolvedParams.entityId === 'entity-1' ? 'Patrimoine Personnel' :
                     resolvedParams.entityId === 'entity-2' ? 'LMNP Dupont' : 'SCI Familiale',
        entity_type: resolvedParams.entityId === 'entity-1' ? 'personal' :
                     resolvedParams.entityId === 'entity-2' ? 'lmnp' : 'sci_is',
        calculation_year: year,
        total_properties: resolvedParams.entityId === 'entity-2' ? 2 : 1,
        aggregated_results: {
          total_rental_income: resolvedParams.entityId === 'entity-2' ? 28800 : 21600,
          total_expenses: resolvedParams.entityId === 'entity-2' ? 8500 : 6200,
          total_depreciation: resolvedParams.entityId === 'entity-2' ? 12000 : 8500,
          total_taxable_result: resolvedParams.entityId === 'entity-2' ? 8300 : 6900,
          total_tax_due: resolvedParams.entityId === 'entity-2' ?
            (resolvedParams.entityId === 'entity-3' ? 1245 : 3066) :
            (resolvedParams.entityId === 'entity-3' ? 1035 : 2553)
        }
      }
    };

    return NextResponse.json(demoFiscalData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}