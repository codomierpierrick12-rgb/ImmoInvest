import { NextRequest, NextResponse } from 'next/server';
import { getDefaultFiscalSettings } from '@/lib/calculations/fiscal';

// GET /api/v1/portfolios/[portfolioId]/entities
export async function GET(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    // DEMO MODE: Return demo data for testing
    const demoEntities = [
      {
        id: 'entity-1',
        name: 'Patrimoine Personnel',
        type: 'personal',
        properties_count: 1,
        incorporation_date: null,
        created_at: new Date().toISOString(),
        fiscal_settings: getDefaultFiscalSettings('personal'),
      },
      {
        id: 'entity-2',
        name: 'LMNP Dupont',
        type: 'lmnp',
        properties_count: 2,
        incorporation_date: null,
        created_at: new Date().toISOString(),
        fiscal_settings: getDefaultFiscalSettings('lmnp'),
      },
      {
        id: 'entity-3',
        name: 'SCI Familiale',
        type: 'sci_is',
        properties_count: 1,
        incorporation_date: '2023-01-15',
        created_at: new Date().toISOString(),
        fiscal_settings: getDefaultFiscalSettings('sci_is'),
      }
    ];

    return NextResponse.json({
      entities: demoEntities,
      total: demoEntities.length
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/portfolios/[portfolioId]/entities
export async function POST(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    const body = await request.json();

    // DEMO MODE: Return created entity
    const newEntity = {
      id: `entity-${Date.now()}`,
      name: body.name,
      type: body.type,
      properties_count: 0,
      incorporation_date: body.incorporation_date || null,
      created_at: new Date().toISOString(),
      fiscal_settings: getDefaultFiscalSettings(body.type),
    };

    return NextResponse.json(newEntity, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    );
  }
}